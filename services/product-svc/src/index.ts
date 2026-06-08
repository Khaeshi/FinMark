import express from 'express'
import { productRoutes } from './routes/index'
import { startConsumer } from './queue/productConsumer'
import { createLogger } from '@finmark/shared'

const app = express()
const PORT = process.env.PRODUCT_SVC_PORT || 4004
const logger = createLogger('product-svc')

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'product-svc', status: 'healthy' })
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
