import type { JwtPayload } from '@finmark/shared'

declare global {
  namespace Express {
    interface Request {
      user?:      JwtPayload
      requestId?: string
    }
  }
}

export {}
