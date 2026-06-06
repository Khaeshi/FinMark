import { MetricCard } from '@/components/dashboard/MetricCard'
import { RevenueChart } from '@/components/dashboard/RevenueChart'
import { OrderTable } from '@/components/dashboard/OrderTable'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
/**
 * MOCK_DASHBOARD for now
 * later it would be ->
 * const data = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`})
 * const { data: dashboard } = await response.json()
 */
import { MOCK_DASHBOARD, MOCK_USER } from '@/lib/mockData'

export default function DashboardPage() {
  const { summary, recentOrders, revenueChart, lastUpdated } = MOCK_DASHBOARD

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <DashboardHeader user={MOCK_USER} lastUpdated={lastUpdated} />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
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
        <div className="xl:col-span-2">
          <RevenueChart data={revenueChart} />
        </div>
        <div className="xl:col-span-1">
          <OrderTable orders={recentOrders} />
        </div>
      </div>
    </div>
  )
}
