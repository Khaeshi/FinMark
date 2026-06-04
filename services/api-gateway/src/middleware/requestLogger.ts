import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  // attach unique request ID for tracing across services
  const requestId = (req.headers['x-request-id'] as string) || uuidv4()
  req.requestId = requestId
  res.setHeader('x-request-id', requestId)

  const start = Date.now()

  // log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start
    const log = {
      level: res.statusCode >= 400 ? 'error' : 'info',
      service: 'api-gateway',
      requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      userId: req.user?.sub,
      userRole: req.user?.role,
      timestamp: new Date().toISOString(),
    }

    // flag slow requests — dashboard target is under 3 seconds
    if (duration > 3000) {
      console.warn(JSON.stringify({ ...log, level: 'warn', flag: 'SLOW_REQUEST' }))
    } else {
      console.log(JSON.stringify(log))
    }
  })

  next()
}
