import express from 'express'
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client'
import { productRoutes } from './routes/index'
import { startConsumer } from './queue/productConsumer'
import { createLogger } from '@finmark/shared'

const app = express()
const PORT = process.env.PRODUCT_SVC_PORT || 4004
const logger = createLogger('product-svc')

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

app.use(express.json())

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

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'product-svc', status: 'healthy' })
})

// metrics endpoint for Prometheus to scrape
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

app.use('/', productRoutes)

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err.message)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  logger.info(`Product service running on port ${PORT}`)
  // start SQS consumer in background
  startConsumer().catch(err => logger.error('Consumer failed to start', err))
})

export default app
