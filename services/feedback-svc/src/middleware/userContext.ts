/**
 * Reads user identity forwarded by the API gateway (x-user-* headers).
 */
import { Request, Response, NextFunction } from 'express'
import type { JwtPayload } from '@finmark/shared'

export function userContext(req: Request, res: Response, next: NextFunction) {
  const userId   = req.headers['x-user-id'] as string
  const role     = req.headers['x-user-role'] as string
  const clientId = req.headers['x-user-client-id'] as string | undefined

  if (!userId || !role) {
    return res.status(401).json({ success: false, error: 'Missing user context' })
  }

  req.user = { sub: userId, role, clientId } as JwtPayload
  next()
}
