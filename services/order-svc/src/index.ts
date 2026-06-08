import express from 'express'
import { orderRoutes } from './routes/index'
import { createLogger } from '@finmark/shared'

const app = express()
const PORT = process.env.ORDER_SVC_PORT || 4002
const logger = createLogger('order-svc')

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'order-svc', status: 'healthy' })
})

app.use('/', orderRoutes)

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err.message)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  logger.info(`Order service running on port ${PORT}`)
})

export default app
