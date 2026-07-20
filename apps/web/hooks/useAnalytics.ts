'use client'
import { useMemo } from 'react'
import { useDashboard } from './useDashboard'
import { useReports } from './useReports'
import { useOrders } from './useOrders'
import { isPermissionDenied } from '@/lib/api-errors'

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

  const ordersByPeriod = useMemo(() => {
    const buckets: Record<string, number> = {}
    for (const order of orders.orders) {
      const d = new Date(order.createdAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      buckets[key] = (buckets[key] || 0) + 1
    }
    return Object.entries(buckets)
      .map(([period, count]) => ({ period, orders: count }))
      .sort((a, b) => a.period.localeCompare(b.period))
  }, [orders.orders])

  const revenueTrend = useMemo(() => {
    const periods = new Set<string>()
    const byClientPeriod: Record<string, Record<string, number>> = {}
    const clientNames: string[] = []

    for (const f of reports.financials) {
      const name = f.client?.name || f.clientId.slice(0, 8)
      periods.add(f.period)
      if (!byClientPeriod[name]) {
        byClientPeriod[name] = {}
        clientNames.push(name)
      }
      byClientPeriod[name][f.period] =
        (byClientPeriod[name][f.period] || 0) + parseFloat(f.revenue || '0')
    }

    const sortedPeriods = Array.from(periods).sort()
    const topClients = clientNames
      .map(name => ({
        name,
        total: Object.values(byClientPeriod[name]).reduce((s, v) => s + v, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map(c => c.name)

    const data = sortedPeriods.map(period => {
      const row: { period: string; [key: string]: string | number } = { period }
      for (const name of topClients) {
        row[name] = byClientPeriod[name]?.[period] || 0
      }
      return row
    })

    return { data, clients: topClients }
  }, [reports.financials])

  const peakHeatmap = useMemo(() => {
    const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const buckets: Record<string, number> = {}
    for (const order of orders.orders) {
      const d = new Date(order.createdAt)
      const day = DAYS[d.getDay()]
      const hour = Math.floor(d.getHours() / 3) * 3
      const key = `${day}:${hour}`
      buckets[key] = (buckets[key] || 0) + 1
    }
    return Object.entries(buckets).map(([key, count]) => {
      const [day, hour] = key.split(':')
      return { day, hour: Number(hour), count }
    })
  }, [orders.orders])

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
    ordersByPeriod,
    revenueTrend,
    peakHeatmap,
    refetch: () => {
      dashboard.refetch()
      reports.refetch()
      orders.refetch()
    },
  }
}
