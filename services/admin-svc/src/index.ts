import express from 'express'
import { adminRoutes } from './routes/index.js'
import { createLogger } from '@finmark/shared'

const app = express()
const PORT = process.env.ADMIN_SVC_PORT || 4005
const logger = createLogger('admin-svc')

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'admin-svc', status: 'healthy' })
})

app.use('/', adminRoutes)

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err.message)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  logger.info(`Admin service running on port ${PORT}`)
})

export default app
