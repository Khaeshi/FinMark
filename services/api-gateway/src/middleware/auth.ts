/**
 * @author Khaesey Angel Tablante
 */

import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import type { JwtPayload, UserRole } from '@finmark/shared'
import { resolveUserFromDatabase } from '../services/userLookup'

declare global {
  namespace Express {
    interface Request {
      user?:      JwtPayload
      requestId?: string
    }
  }
}

const IS_DEV = process.env.NODE_ENV !== 'production'
const DEV_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'dev-secret-replace-in-production'

const jwksClient = jwksRsa({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000,
})

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err || !key) return callback(err || new Error('No signing key'))
    callback(null, key.getPublicKey())
  })
}

const PUBLIC_ROUTES = [
  { path: '/auth/login', method: 'POST' },
  { path: '/auth/dev-login', method: 'POST' },
  { path: '/auth/register', method: 'POST' },
  { path: '/auth/confirm', method: 'POST' },
  { path: '/auth/refresh', method: 'POST' },
  { path: '/auth/forgot-password', method: 'POST' },
  { path: '/auth/reset-password', method: 'POST' },
  { path: '/health', method: 'GET' },
]

function isPublicRoute(path: string, method: string): boolean {
  return PUBLIC_ROUTES.some(
    route => path.startsWith(route.path) && route.method === method
  )
}

function verifyCognitoToken(token: string): Promise<JwtPayload> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getSigningKey, {
      algorithms: ['RS256'],
      issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
    }, (err, decoded) => {
      if (err) reject(err)
      else resolve(decoded as JwtPayload)
    })
  })
}

async function attachDatabaseRole(decoded: JwtPayload): Promise<JwtPayload | null> {
  const dbUser = await resolveUserFromDatabase(decoded.sub)
  if (!dbUser) return null

  return {
    ...decoded,
    email:    dbUser.email,
    role:     dbUser.role,
    clientId: dbUser.clientId,
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === 'OPTIONS') return next()
  if (isPublicRoute(req.path, req.method)) return next()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing authorization header' })
  }

  const token = authHeader.split(' ')[1]

  try {
    let decoded: JwtPayload | null = null

    if (IS_DEV) {
      try {
        decoded = jwt.verify(token, DEV_SECRET) as JwtPayload
      } catch {
        // not a dev token — fall through to Cognito verification
      }
    }

    if (!decoded) {
      if (!process.env.COGNITO_USER_POOL_ID) {
        return res.status(401).json({ success: false, error: 'Auth not configured' })
      }
      decoded = await verifyCognitoToken(token)
    }

    // Roles live in our DB, not in Cognito tokens — resolve on every request
    const user = await attachDatabaseRole(decoded)
    if (!user) {
      return res.status(403).json({
        success: false,
        error: 'Account not found or inactive. Try signing out and back in.',
      })
    }

    req.user = user
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }
    next()
  }
}
