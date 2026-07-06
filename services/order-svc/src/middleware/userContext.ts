/**
 * @author Khaesey Angel Tablante
 */


import { Request, Response, NextFunction } from 'express'
import type { JwtPayload } from '@finmark/shared'

export function userContext(req: Request, res: Response, next: NextFunction) {
  const userId   = req.headers['x-user-id'] as string
  const email    = req.headers['x-user-email'] as string
  const role     = req.headers['x-user-role'] as string
  const clientId = req.headers['x-user-client-id'] as string | undefined


  if (userId && role) {
    req.user = {
      sub:      userId,
      email:    email || '',
      role:     role as any,
      clientId: clientId || undefined,
      iat:      0,
      exp:      0,
    } as JwtPayload
  }
  req.user = { sub: userId, role, clientId } as JwtPayload
  next()
}