import { getCached, setCached } from './dataCache'
import { fetchDashboard, fetchOrders, fetchClients, fetchFinancialReports } from './api-client'

export const DASHBOARD_CACHE_KEY = 'prefetch:dashboard'
export const ORDERS_CACHE_KEY    = 'prefetch:orders:1:ALL'
export const CLIENTS_CACHE_KEY   = 'prefetch:clients'
export const REPORTS_CACHE_KEY   = 'prefetch:reports'

type Prefetcher = (token: string) => Promise<void>

const PREFETCHERS: Record<string, Prefetcher> = {
  '/': async (token) => {
    if (getCached(DASHBOARD_CACHE_KEY)) return
    const data = await fetchDashboard(token)
    setCached(DASHBOARD_CACHE_KEY, data)
  },
  '/orders': async (token) => {
    if (getCached(ORDERS_CACHE_KEY)) return
    const data = await fetchOrders(token, { page: 1, limit: 20 })
    setCached(ORDERS_CACHE_KEY, data)
  },
  '/clients': async (token) => {
    if (getCached(CLIENTS_CACHE_KEY)) return
    const data = await fetchClients(token)
    setCached(CLIENTS_CACHE_KEY, data)
  },
  '/reports': async (token) => {
    if (getCached(REPORTS_CACHE_KEY)) return
    const data = await fetchFinancialReports(token)
    setCached(REPORTS_CACHE_KEY, data)
  },
}

/**
 * Warms the data cache for a sidebar link, fired once useHoverIntent decides
 * the hover was real intent. Silently swallows failures — this is a
 * speculative optimization, never something that should surface an error to
 * the user. If it fails, the page just falls through to its normal fetch.
 */
export function prefetchRoute(href: string, token?: string | null): void {
  if (!token) return
  const prefetcher = PREFETCHERS[href]
  if (!prefetcher) return
  prefetcher(token).catch(() => {
    // no-op — normal page-level fetch + skeleton is the fallback
  })
}
