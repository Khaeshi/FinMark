import express from 'express'
import { reportRoutes } from './routes/index'
import { startRefreshJob } from './jobs/refreshMaterialized'
import { createLogger } from '@finmark/shared'

const app = express()
const PORT = process.env.REPORT_SVC_PORT || 4003
const logger = createLogger('report-svc')

app.use(express.json())

// health check
app.get('/health', (req, res) => {
  res.json({ success: true, service: 'report-svc', status: 'healthy' })
})

// routes
app.use('/', reportRoutes)

// start materialized view refresh scheduler
startRefreshJob()

app.listen(PORT, () => {
  logger.info(`Report service running on port ${PORT}`)
})

export default app
