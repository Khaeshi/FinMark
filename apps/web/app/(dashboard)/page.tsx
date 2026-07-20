'use client'
import { sileo } from 'sileo'
import {
  PhilippinePeso, Package, Building2, Clock,
  TrendingUp, ShoppingCart, CheckCircle2, Target,
} from 'lucide-react'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { OrderTable } from '@/components/dashboard/OrderTable'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
import { PermissionDenied } from '@/components/dashboard/PermissionDenied'
import { isPermissionDenied } from '@/lib/api-errors'
import { useDashboard } from '@/hooks/useDashboard'
import { useAuth } from '@/lib/auth-context'
import { MOCK_USER } from '@/lib/mockData'

export default function DashboardPage() {
  const { data, isLoading, error, isFromCache, isMock, refetch } = useDashboard()
  const { user } = useAuth()

  const displayUser = user
    ? { name: user.name, role: user.role }
    : MOCK_USER

  if (isLoading) return <DashboardSkeleton />

  if (!isLoading && isPermissionDenied(error)) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <DashboardHeader
          user={displayUser}
          lastUpdated={new Date()}
          isMock={false}
          error={error}
        />
        <PermissionDenied />
      </div>
    )
  }

  if (!data) return (
    <div className="p-8 flex flex-col items-center justify-center h-full gap-3">
      <p className="text-slate-400">
        {error ?? 'No dashboard data available.'}
      </p>
      <button
        onClick={refetch}
        className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
      >
        Try again
      </button>
    </div>
  )

  const { summary, recentOrders, revenueChart, lastUpdated } = data

  const netProfit = revenueChart.reduce((s, d) => s + parseFloat(d.profit), 0)
  const avgOrderValue = summary.totalOrders > 0
    ? parseFloat(summary.totalRevenue) / summary.totalOrders
    : 0
  const fulfilledCount = recentOrders.filter(o => o.status === 'FULFILLED').length
  const fulfillmentRate = recentOrders.length > 0
    ? (fulfilledCount / recentOrders.length) * 100
    : 0
  const revenueTarget = summary.totalOrders > 0
    ? ((summary.totalOrders - summary.pendingOrders) / summary.totalOrders) * 100
    : 0

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <DashboardHeader
        user={displayUser}
        lastUpdated={lastUpdated}
        isFromCache={isFromCache}
        isMock={isMock}
        onRefresh={() => { refetch(); sileo.success({ title: 'Dashboard refreshed' }) }}
        error={error}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
        <MetricCard
          label="Total Revenue"
          value={summary.totalRevenue}
          type="currency"
          trend={+12.4}
          icon={<PhilippinePeso className="h-4 w-4" />}
          accent="#10B981"
        />
        <MetricCard
          label="Total Orders"
          value={summary.totalOrders}
          type="number"
          trend={+8.1}
          icon={<Package className="h-4 w-4" />}
          accent="#3B82F6"
        />
        <MetricCard
          label="Active Clients"
          value={summary.activeClients}
          type="number"
          trend={+3.2}
          icon={<Building2 className="h-4 w-4" />}
          accent="#8B5CF6"
        />
        <MetricCard
          label="Pending Orders"
          value={summary.pendingOrders}
          type="number"
          trend={-5.0}
          icon={<Clock className="h-4 w-4" />}
          accent="#F59E0B"
        />
        <MetricCard
          label="Net Profit"
          value={netProfit.toString()}
          type="currency"
          trend={+18.6}
          icon={<TrendingUp className="h-4 w-4" />}
          accent="#14B8A6"
        />
        <MetricCard
          label="Avg Order Value"
          value={avgOrderValue.toString()}
          type="currency"
          trend={+4.2}
          icon={<ShoppingCart className="h-4 w-4" />}
          accent="#6366F1"
        />
        <MetricCard
          label="Fulfillment Rate"
          value={fulfillmentRate}
          type="percent"
          trend={+2.1}
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent="#059669"
        />
        <MetricCard
          label="Revenue Target"
          value={revenueTarget}
          type="percent"
          trend={-1.4}
          icon={<Target className="h-4 w-4" />}
          accent="#EAB308"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 min-w-0">
          <RevenueChart data={revenueChart} />
        </div>
        <div className="xl:col-span-1 min-w-0">
          <OrderTable orders={recentOrders} />
        </div>
      </div>
    </div>
  )
}
