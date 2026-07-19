import express from 'express'
import { authRoutes } from './routes/index'
import { createLogger } from '@finmark/shared'

const app = express()
const PORT = Number(process.env.PORT || process.env.USER_AUTH_SVC_PORT || 4001)
const logger = createLogger('user-auth-svc')

app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ success: true, service: 'user-auth-svc', status: 'healthy' })
})

app.use('/', authRoutes)

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', err.message)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

app.listen(PORT, () => {
  logger.info(`User auth service running on port ${PORT}`)
})

export default app
