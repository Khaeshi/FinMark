/**
 * @author Khaesey Angel Tablante
 */


import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import type { JwtPayload, UserRole } from '@finmark/shared'

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
  { path: '/auth/login',          method: 'POST' },
  { path: '/auth/dev-login',      method: 'POST' },
  { path: '/auth/register',       method: 'POST' },
  { path: '/auth/confirm',        method: 'POST' },
  { path: '/auth/refresh',        method: 'POST' },
  { path: '/auth/forgot-password', method: 'POST' },
  { path: '/auth/reset-password', method: 'POST' },
  { path: '/health',                  method: 'GET' },
]

function isPublicRoute(path: string, method: string): boolean {
  console.log('Checking path:', path, method)
  const match = PUBLIC_ROUTES.some(
    route => path.startsWith(route.path) && route.method === method
  )
  console.log('Is public:', match)  // ← add this line
  return match
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  if (isPublicRoute(req.path, req.method)) return next()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing authorization header' })
  }

  const token = authHeader.split(' ')[1]

  // ─── Dev token path (fast, no Cognito needed) ────────────────────────────
  if (IS_DEV) {
    try {
      const decoded = jwt.verify(token, DEV_SECRET) as JwtPayload
      req.user = decoded
      return next()
    } catch {
      // not a dev token — fall through to Cognito verification
    }
  }

  // ─── Production Cognito token path ───────────────────────────────────────
  if (!process.env.COGNITO_USER_POOL_ID) {
    return res.status(401).json({ success: false, error: 'Auth not configured' })
  }

  jwt.verify(token, getSigningKey, {
    algorithms: ['RS256'],
    issuer: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}`,
  }, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, error: 'Invalid or expired token' })
    }
    req.user = decoded as JwtPayload
    next()
  })
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
