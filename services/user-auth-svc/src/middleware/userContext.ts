/**
 * Reads user identity forwarded by the API gateway (x-user-* headers).
 * Optional — public auth routes (login, etc.) have no headers.
 */
import { Request, Response, NextFunction } from 'express'
import type { JwtPayload } from '@finmark/shared'

export function userContext(req: Request, _res: Response, next: NextFunction) {
  const userId   = req.headers['x-user-id'] as string
  const role     = req.headers['x-user-role'] as string
  const clientId = req.headers['x-user-client-id'] as string | undefined
  const email    = req.headers['x-user-email'] as string | undefined

  if (userId && role) {
    req.user = {
      sub:      userId,
      email:    email || '',
      role:     role as JwtPayload['role'],
      clientId: clientId || undefined,
      iat:      0,
      exp:      0,
    } as JwtPayload
  }

  next()
}
