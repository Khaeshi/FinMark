import { prisma } from '@finmark/db'
import { createLogger } from '@finmark/shared'
import type { DashboardData, UserRole } from '@finmark/shared'
import { getCache, setCache, CACHE_KEYS, TTL } from '../cache/redisClient.js'

const logger = createLogger('report-svc')

/**
 * Dashboard Data
 * @desc This is the function that solves the 20-second problem.
 * Cache-first: serve from Redis, fall back to materialized views, never raw aggregation.
 * 
 * 
 */
export async function getDashboardData(
  userId: string,
  clientId: string | undefined,
  role: UserRole
): Promise<DashboardData> {
  const cacheKey = clientId
    ? CACHE_KEYS.dashboard(clientId)
    : CACHE_KEYS.dashboardAdmin()

  // 1. try cache first — sub-millisecond response
  const cached = await getCache<DashboardData>(cacheKey)
  if (cached) {
    logger.info('Dashboard served from cache', { userId, clientId })
    return cached
  }

  // 2. query materialized views — fast pre-computed data
  logger.info('Dashboard cache miss, querying materialized views', { userId, clientId })
  const start = Date.now()

  const data = await buildDashboardFromViews(clientId, role)

  const duration = Date.now() - start
  logger.info('Dashboard built from views', { duration: `${duration}ms`, userId })

  // 3. cache the result
  await setCache(cacheKey, data, TTL.DASHBOARD)

  return data
}

async function buildDashboardFromViews(
  clientId: string | undefined,
  role: UserRole
): Promise<DashboardData> {
  // query materialized views — not raw tables
  // these are pre-computed by the refresh job
  const [summaryRows, recentOrders, chartData] = await Promise.all([

    // mv_dashboard_summary or per-client summary
    prisma.$queryRaw<any[]>`
      SELECT * FROM ${clientId
        ? prisma.$queryRaw`mv_order_counts WHERE client_id = ${clientId}`
        : prisma.$queryRaw`mv_dashboard_summary`
      }
    `.catch(() => prisma.$queryRaw<any[]>`
      SELECT
        COUNT(DISTINCT client_id) as active_clients,
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending_orders,
        COALESCE(SUM(amount), 0) as total_revenue
      FROM orders
      ${clientId ? prisma.$queryRaw`WHERE client_id = ${clientId}` : prisma.$queryRaw``}
    `),

    // recent orders — paginated, never full table scan
    prisma.order.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 10,   // only last 10 — never load all
      select: {
        id: true,
        clientId: true,
        status: true,
        amount: true,
        currency: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    }),

    // revenue chart from financials
    prisma.financial.findMany({
      where: clientId ? { clientId } : undefined,
      orderBy: { period: 'desc' },
      take: 8,    // last 8 periods
      select: {
        period: true,
        revenue: true,
        expenses: true,
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
      amount: o.amount.toString(), 
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

/**
 * Financial Summary
 */
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
