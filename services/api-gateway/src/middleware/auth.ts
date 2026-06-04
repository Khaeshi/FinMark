import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import jwksRsa from 'jwks-rsa'
import type { JwtPayload, UserRole } from '@finmark/shared'

// extend express Request to carry the decoded user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
      requestId?: string
    }
  }
}

const jwksClient = jwksRsa({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID}/.well-known/jwks.json`,
  cache: true,
  cacheMaxEntries: 5,
  cacheMaxAge: 600000, // 10 minutes
})

function getSigningKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  jwksClient.getSigningKey(header.kid, (err, key) => {
    if (err || !key) return callback(err || new Error('No signing key'))
    callback(null, key.getPublicKey())
  })
}

// routes that don't need authentication
const PUBLIC_ROUTES = [
  { path: '/api/auth/login', method: 'POST' },
  { path: '/api/auth/register', method: 'POST' },
  { path: '/api/auth/refresh', method: 'POST' },
  { path: '/health', method: 'GET' },
]

function isPublicRoute(path: string, method: string): boolean {
  return PUBLIC_ROUTES.some(
    route => path.startsWith(route.path) && route.method === method
  )
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  // skip auth for public routes
  if (isPublicRoute(req.path, req.method)) return next()

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Missing or invalid authorization header' })
  }

  const token = authHeader.split(' ')[1]

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

// role-based access control middleware factory
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
