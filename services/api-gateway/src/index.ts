import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { authMiddleware } from './middleware/auth'
import { rateLimiter, strictRateLimiter } from './middleware/rateLimiter'
import { requestLogger } from './middleware/requestLogger'
import { proxyRoutes } from './routes/proxy'
import { healthRouter } from './routes/health'

const app = express()
const PORT = process.env.PORT || 4000

/**
 * Security Headers
 */
app.use(helmet())

/**
 * CORS
 */
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
}))

/**
 * Body Parser
 */
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(requestLogger)

/**
 * Health Check (no auth needed)
 */
app.use('/health', healthRouter)

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

app.listen(PORT, () => {
  console.log(JSON.stringify({
    level: 'info',
    service: 'api-gateway',
    message: `API Gateway running on port ${PORT}`,
    timestamp: new Date().toISOString(),
  }))
})


export default app
