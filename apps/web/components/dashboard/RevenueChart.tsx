'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
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
    <div
      className="rounded-2xl border border-white/[0.06] p-5 lg:p-6"
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white font-semibold text-base">Revenue Overview</h2>
          <p className="text-slate-500 text-xs mt-0.5">Quarterly performance</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            PHP
          </span>
          <span className="text-[11px] font-medium text-slate-500 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
            12M
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10B981" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
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
              background: '#141820',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
            formatter={(value: number) => [formatMillions(value), '']}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#94a3b8', paddingTop: '16px' }}
            iconType="circle"
            iconSize={8}
          />
          <Area type="monotone" dataKey="Revenue"  stroke="#10B981" strokeWidth={2} fill="url(#colorRevenue)" dot={false} />
          <Area type="monotone" dataKey="Profit"   stroke="#3B82F6" strokeWidth={2} fill="url(#colorProfit)" dot={false} />
          <Area type="monotone" dataKey="Expenses" stroke="#F59E0B" strokeWidth={1.5} fill="none" strokeDasharray="4 4" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
