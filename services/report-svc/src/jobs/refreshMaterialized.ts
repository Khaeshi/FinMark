/**
 * @author Khaesey Angel Tablante
 */


import cron from 'node-cron'
import { prisma } from '@finmark/db'
import { createLogger } from '@finmark/shared'
import { invalidateCache } from '../cache/redisClient'

const logger = createLogger('report-svc:refresh-job')

export function startRefreshJob() {
  // refresh every 2 minutes during business hours (8am-8pm PHT)
  // this keeps dashboard data fresh without hammering the DB
  cron.schedule('*/2 8-20 * * 1-5', async () => {
    await refreshViews()
  }, { timezone: 'Asia/Manila' })

  // slower refresh outside business hours
  cron.schedule('*/15 * * * *', async () => {
    const hour = new Date().getHours()
    if (hour < 8 || hour > 20) {
      await refreshViews()
    }
  })

  logger.info('Materialized view refresh job started')
}

async function refreshViews() {
  const start = Date.now()
  try {
    logger.info('Refreshing materialized views...')

    // call the SQL function we defined in 002_materialized_views.sql
    await prisma.$executeRaw`SELECT refresh_dashboard_views()`

    // invalidate Redis cache so next request gets fresh data
    await invalidateCache('dashboard:*')
    await invalidateCache('financial:*')
    await invalidateCache('orders:counts:*')

    const duration = Date.now() - start
    logger.info('Materialized views refreshed', { duration: `${duration}ms` })
  } catch (err) {
    logger.error('Failed to refresh materialized views', err)
    // non-fatal — stale cache is better than no cache
  }
}
