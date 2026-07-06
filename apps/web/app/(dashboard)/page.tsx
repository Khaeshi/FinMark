'use client'
import { sileo } from 'sileo'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { OrderTable } from '@/components/dashboard/OrderTable'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton'
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

  if (!data) return (
    <div className="p-8 flex flex-col items-center justify-center h-full gap-3">
      <p className="text-slate-400">No dashboard data available.</p>
      <button
        onClick={refetch}
        className="text-emerald-400 text-sm hover:text-emerald-300 transition-colors"
      >
        Try again
      </button>
    </div>
  )

  const { summary, recentOrders, revenueChart, lastUpdated } = data

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <DashboardHeader
        user={displayUser}
        lastUpdated={lastUpdated}
        isFromCache={isFromCache}
        isMock={isMock}
        onRefresh={() => { refetch(); sileo.success({ title: 'Dashboard refreshed' }) }}
        error={error}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 min-w-0">
        <MetricCard
          label="Total Revenue"
          value={summary.totalRevenue}
          type="currency"
          trend={+12.4}
          icon="₱"
          accent="#10B981"
        />
        <MetricCard
          label="Total Orders"
          value={summary.totalOrders}
          type="number"
          trend={+8.1}
          icon="📦"
          accent="#3B82F6"
        />
        <MetricCard
          label="Active Clients"
          value={summary.activeClients}
          type="number"
          trend={+3.2}
          icon="🏢"
          accent="#8B5CF6"
        />
        <MetricCard
          label="Pending Orders"
          value={summary.pendingOrders}
          type="number"
          trend={-5.0}
          icon="⏳"
          accent="#F59E0B"
        />
      </div>

      {/* Charts + Table */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
