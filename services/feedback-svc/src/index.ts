import express from 'express'
import { feedbackRoutes } from './routes/index.js'
import { createLogger } from '@finmark/shared'

const app = express()
const PORT = process.env.FEEDBACK_SVC_PORT || 4006
const logger = createLogger('feedback-svc')

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'feedback-svc', status: 'healthy' })
})

app.use('/', feedbackRoutes)

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err.message)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  logger.info(`Feedback service running on port ${PORT}`)
})

export default app
