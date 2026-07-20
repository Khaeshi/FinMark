import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client'
import { authMiddleware } from './middleware/auth'
import { rateLimiter, strictRateLimiter } from './middleware/rateLimiter'
import { requestLogger } from './middleware/requestLogger'
import { proxyRoutes } from './routes/proxy'
import { healthRouter } from './routes/health'

const app = express()
const PORT = Number(process.env.PORT || 4000)

/** Strip trailing slashes — browsers never send them in the Origin header. */
function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '')
}

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true

  const normalized = normalizeOrigin(origin)
  const allowed = (process.env.ALLOWED_ORIGINS || 'http://localhost:3001')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)

  if (allowed.includes(normalized)) return true

  // Vercel preview URLs change on every deploy; match project prefix safely.
  const vercelPattern =
    process.env.VERCEL_ORIGIN_PATTERN ||
    '^https://fin-mark-web-pyee([-.a-z0-9]*)?\\.vercel\\.app$'

  return new RegExp(vercelPattern).test(normalized)
}

const register = new Registry()
collectDefaultMetrics({ register })

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status'],
  buckets: [5, 10, 25, 50, 100, 250, 500, 1000, 3000],
  registers: [register],
})

const httpRequestTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [register],
})

/**
 * Security Headers
 */
app.use(helmet())

/**
 * Preflight (OPTIONS) short-circuit — use middleware instead of app.options('*')
 * because Express 5 / path-to-regexp v8 rejects bare '*' wildcards.
 */
app.use((req, res, next) => {
  if (req.method !== 'OPTIONS') return next()

  const origin = req.headers.origin as string | undefined
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-request-id')
  return res.sendStatus(204)
})

/**
 * CORS
 */
app.use(cors({
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, origin || true)
    } else {
      callback(new Error(`CORS blocked origin: ${origin}`))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
}))

/**
 * Body Parser
 */
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(requestLogger)

// middleware to track all requests
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    httpRequestDuration.observe(
      { method: req.method, route: req.path, status: String(res.statusCode) },
      duration
    )
    httpRequestTotal.inc(
      { method: req.method, route: req.path, status: String(res.statusCode) }
    )
  })
  next()
})

/**
 * Health Check (no auth needed)
 */
app.use('/health', healthRouter)

// metrics endpoint for Prometheus to scrape
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

/**
 * Rate Limiting
 */
app.use('/api/auth', strictRateLimiter)   // stricter on auth routes
app.use('/api', rateLimiter)              // general rate limit

/**
 * Authentication
 */
app.use('/api', authMiddleware)

/**
 * Proxy to Microservices
 */
app.use('/api', proxyRoutes)

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' })
})

/**
 * Global Error Handler
 */
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(JSON.stringify({
    level: 'error',
    service: 'api-gateway',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString(),
  }))
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(JSON.stringify({
    level: 'info',
    service: 'api-gateway',
    message: `API Gateway running on 0.0.0.0:${PORT}`,
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }))
})


export default app
