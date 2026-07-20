'use client'
import { useMemo } from 'react'
import { useDashboard } from './useDashboard'
import { useReports } from './useReports'
import { useOrders } from './useOrders'
import { isPermissionDenied } from '@/lib/api-errors'

// fix import path - useReports is in hooks folder
export function useAnalytics() {
  const dashboard = useDashboard()
  const reports   = useReports()
  const orders    = useOrders()

  const isLoading = dashboard.isLoading || reports.isLoading || orders.isLoading

  const orderStatusBreakdown = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const order of orders.orders) {
      counts[order.status] = (counts[order.status] || 0) + 1
    }
    return Object.entries(counts)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count)
  }, [orders.orders])

  const clientRevenue = useMemo(() => {
    const byClient: Record<string, { name: string; revenue: number; profit: number }> = {}
    for (const f of reports.financials) {
      const name = f.client?.name || f.clientId.slice(0, 8)
      if (!byClient[f.clientId]) {
        byClient[f.clientId] = { name, revenue: 0, profit: 0 }
      }
      byClient[f.clientId].revenue += parseFloat(f.revenue || '0')
      byClient[f.clientId].profit  += parseFloat(f.netProfit || '0')
    }
    return Object.values(byClient).sort((a, b) => b.revenue - a.revenue)
  }, [reports.financials])

  const error =
    dashboard.error || reports.error || orders.error

  const permissionDenied =
    isPermissionDenied(dashboard.error) ||
    isPermissionDenied(reports.error) ||
    isPermissionDenied(orders.error)

  return {
    dashboard:           dashboard.data,
    isLoading,
    error,
    permissionDenied,
    orderStatusBreakdown,
    clientRevenue,
    refetch: () => {
      dashboard.refetch()
      reports.refetch()
      orders.refetch()
    },
  }
}
