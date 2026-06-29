/**
 * @author Khaesey Angel Tablante
 */


import { prisma } from '@finmark/db'
import { createLogger } from '@finmark/shared'
import type { DashboardData, UserRole } from '@finmark/shared'
import { getCache, setCache, CACHE_KEYS, TTL } from '../cache/redisClient'

const logger = createLogger('report-svc')

export async function getDashboardData(
  userId: string,
  clientId: string | undefined,
  role: UserRole
): Promise<DashboardData> {
  const cacheKey = clientId
    ? CACHE_KEYS.dashboard(clientId)
    : CACHE_KEYS.dashboardAdmin()

  const cached = await getCache<DashboardData>(cacheKey)
  if (cached) {
    logger.info('Dashboard served from cache', { userId, clientId })
    return cached
  }

  logger.info('Dashboard cache miss, querying materialized views', { userId, clientId })
  const start = Date.now()

  const data = await buildDashboardFromViews(clientId, role)

  const duration = Date.now() - start
  logger.info('Dashboard built from views', { duration: `${duration}ms`, userId })

  await setCache(cacheKey, data, TTL.DASHBOARD)

  return data
}

async function buildDashboardFromViews(
  clientId: string | undefined,
  role: UserRole
): Promise<DashboardData> {
  const [summaryRows, recentOrders, chartData] = await Promise.all([

    clientId
      ? prisma.$queryRaw<any[]>`
          SELECT * FROM mv_order_counts
          WHERE client_id = ${clientId}
        `
      : prisma.$queryRaw<any[]>`
          SELECT * FROM mv_dashboard_summary
        `,

    prisma.order.findMany({
      where:   clientId ? { clientId } : undefined,
      orderBy: { createdAt: 'desc' },
      take:    10,
      select: {
        id:          true,
        clientId:    true,
        status:      true,
        amount:      true,
        currency:    true,
        description: true,
        createdAt:   true,
        updatedAt:   true,
      },
    }),

    prisma.financial.findMany({
      where:   clientId ? { clientId } : undefined,
      orderBy: { period: 'desc' },
      take:    8,
      select: {
        period:    true,
        revenue:   true,
        expenses:  true,
        netProfit: true,
      },
    }),
  ])

  const summary = summaryRows[0] || {}

  return {
    summary: {
      totalRevenue:  summary.total_revenue?.toString() || '0',
      totalOrders:   Number(summary.total_orders) || 0,
      activeClients: Number(summary.active_clients) || 0,
      pendingOrders: Number(summary.pending_orders) || 0,
    },
    recentOrders: recentOrders.map(o => ({
      ...o,
      amount:      o.amount.toString(),
      description: o.description ?? undefined,
    })),
    revenueChart: chartData.map(f => ({
      date:     f.period,
      revenue:  f.revenue.toString(),
      expenses: f.expenses.toString(),
      profit:   f.netProfit.toString(),
    })),
    lastUpdated: new Date(),
  }
}

export async function getFinancialSummary(clientId: string, period: string) {
  const cacheKey = CACHE_KEYS.financialSummary(clientId, period)
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const data = await prisma.financial.findUnique({
    where: { clientId_period: { clientId, period } },
  })

  if (data) await setCache(cacheKey, data, TTL.FINANCIALS)
  return data
}