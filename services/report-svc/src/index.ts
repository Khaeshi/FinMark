import express from 'express'
import { collectDefaultMetrics, Registry, Counter, Histogram } from 'prom-client'
import { reportRoutes } from './routes/index'
import { startRefreshJob } from './jobs/refreshMaterialized'
import { createLogger } from '@finmark/shared'
import { userContext } from './middleware/userContext'

const app = express()
const PORT = Number(process.env.PORT || process.env.REPORT_SVC_PORT || 4003)
const logger = createLogger('report-svc')

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

// health check
app.get('/health', (req, res) => {
  res.json({ success: true, service: 'report-svc', status: 'healthy' })
})

// metrics endpoint for Prometheus to scrape
app.get('/metrics', async (_req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

// routes
app.use(userContext)
app.use('/', reportRoutes)

// start materialized view refresh scheduler
startRefreshJob()

app.listen(PORT, () => {
  logger.info(`Report service running on port ${PORT}`)
})

export default app
