'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import type { RevenueMetric } from '@finmark/shared'

interface Props { data: RevenueMetric[] }

function formatMillions(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `₱${(value / 1_000).toFixed(0)}K`
  return `₱${value}`
}

export function RevenueChart({ data }: Props) {
  const chartData = data.map(d => ({
    period:   d.date,
    Revenue:  parseFloat(d.revenue),
    Expenses: parseFloat(d.expenses),
    Profit:   parseFloat(d.profit),
  }))

  return (
    <div className="rounded-2xl border border-white/5 p-5" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold text-base">Revenue Overview</h2>
          <p className="text-slate-400 text-xs mt-0.5">Quarterly performance</p>
        </div>
        <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full">PHP</span>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="period"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatMillions}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <Tooltip
            contentStyle={{
              background: '#0F172A',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
            }}
            formatter={(value: number) => [formatMillions(value), '']}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '12px' }}
          />
          <Area type="monotone" dataKey="Revenue"  stroke="#10B981" strokeWidth={2} fill="url(#colorRevenue)" />
          <Area type="monotone" dataKey="Profit"   stroke="#3B82F6" strokeWidth={2} fill="url(#colorProfit)" />
          <Area type="monotone" dataKey="Expenses" stroke="#F59E0B" strokeWidth={1.5} fill="none" strokeDasharray="4 4" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
