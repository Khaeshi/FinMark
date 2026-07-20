'use client'
import { sileo } from 'sileo'
import { RefreshCw, TrendingUp, Package, Building2, BarChart3 } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { PermissionDenied } from '@/components/dashboard/PermissionDenied'
import { OrderStatusChart } from '@/components/analytics/OrderStatusChart'
import { ClientRevenueChart } from '@/components/analytics/ClientRevenueChart'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { formatPHP } from '@/lib/format'

export default function AnalyticsPage() {
  const {
    dashboard, isLoading, error, permissionDenied,
    orderStatusBreakdown, clientRevenue, refetch,
  } = useAnalytics()

  if (isLoading && !dashboard) return <DashboardSkeleton />

  if (permissionDenied) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Marketing analytics and business intelligence</p>
        </div>
        <PermissionDenied />
      </div>
    )
  }

  const summary = dashboard?.summary
  const totalProfit = dashboard?.revenueChart.reduce(
    (s, d) => s + parseFloat(d.profit), 0
  ) ?? 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Revenue trends, order pipeline, and client performance</p>
        </div>
        <button
          onClick={() => { refetch(); sileo.success({ title: 'Analytics refreshed' }) }}
          className="flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:bg-white/[0.07] hover:text-white transition-all"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {error && !dashboard && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <MetricCard
            label="Total Revenue"
            value={summary.totalRevenue}
            type="currency"
            trend={+12.4}
            icon={<TrendingUp className="h-4 w-4" />}
            accent="#10B981"
          />
          <MetricCard
            label="Net Profit"
            value={totalProfit.toString()}
            type="currency"
            trend={+18.6}
            icon={<BarChart3 className="h-4 w-4" />}
            accent="#3B82F6"
          />
          <MetricCard
            label="Total Orders"
            value={summary.totalOrders}
            type="number"
            trend={+8.1}
            icon={<Package className="h-4 w-4" />}
            accent="#8B5CF6"
          />
          <MetricCard
            label="Active Clients"
            value={summary.activeClients}
            type="number"
            trend={+3.2}
            icon={<Building2 className="h-4 w-4" />}
            accent="#F59E0B"
          />
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {dashboard?.revenueChart && dashboard.revenueChart.length > 0 ? (
          <div className="xl:col-span-2">
            <RevenueChart data={dashboard.revenueChart} />
          </div>
        ) : (
          <div
            className="xl:col-span-2 rounded-2xl border border-white/[0.06] p-10 flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.025)' }}
          >
            <p className="text-slate-500 text-sm">No revenue history yet — run db:seed to populate</p>
          </div>
        )}

        <div
          className="rounded-2xl border border-white/[0.06] p-5 lg:p-6"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <h2 className="text-white font-semibold text-base mb-1">Order Pipeline</h2>
          <p className="text-slate-500 text-xs mb-4">Status breakdown from recent orders</p>
          <OrderStatusChart data={orderStatusBreakdown} />
        </div>

        <div
          className="rounded-2xl border border-white/[0.06] p-5 lg:p-6"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <h2 className="text-white font-semibold text-base mb-1">Top Clients by Revenue</h2>
          <p className="text-slate-500 text-xs mb-4">Aggregated from financial records</p>
          <ClientRevenueChart data={clientRevenue} />
        </div>
      </div>

      {clientRevenue.length > 0 && (
        <div
          className="rounded-2xl border border-white/[0.06] overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-white font-semibold text-base">Client Performance</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Client', 'Revenue', 'Net Profit', 'Margin'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clientRevenue.map((row, i) => {
                  const margin = row.revenue > 0 ? (row.profit / row.revenue) * 100 : 0
                  return (
                    <tr key={row.name} className={`border-b border-white/[0.04] ${i === clientRevenue.length - 1 ? 'border-none' : ''}`}>
                      <td className="px-5 py-3.5 text-sm font-medium text-white">{row.name}</td>
                      <td className="px-5 py-3.5 text-sm text-emerald-400 font-semibold">{formatPHP(String(row.revenue))}</td>
                      <td className="px-5 py-3.5 text-sm text-blue-400 font-semibold">{formatPHP(String(row.profit))}</td>
                      <td className="px-5 py-3.5 text-sm text-slate-400">{margin.toFixed(1)}%</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
