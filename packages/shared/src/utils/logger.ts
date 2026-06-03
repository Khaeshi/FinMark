/**
 * Logger   
 * @desc Structured JSON logging for easy parsing in CloudWatch / monitoring
 */


type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  service: string
  message: string
  timestamp: string
  data?: unknown
  requestId?: string
}

function log(level: LogLevel, service: string, message: string, data?: unknown, requestId?: string) {
  const entry: LogEntry = {
    level,
    service,
    message,
    timestamp: new Date().toISOString(),
    ...(data !== undefined && { data }),
    ...(requestId && { requestId }),
  }

  const output = JSON.stringify(entry)

  if (level === 'error') {
    console.error(output)
  } else if (level === 'warn') {
    console.warn(output)
  } else {
    console.log(output)
  }
}

export function createLogger(service: string) {
  return {
    info:  (message: string, data?: unknown, requestId?: string) => log('info',  service, message, data, requestId),
    warn:  (message: string, data?: unknown, requestId?: string) => log('warn',  service, message, data, requestId),
    error: (message: string, data?: unknown, requestId?: string) => log('error', service, message, data, requestId),
    debug: (message: string, data?: unknown, requestId?: string) => {
      if (process.env.NODE_ENV !== 'production') {
        log('debug', service, message, data, requestId)
      }
    },
  }
}
