'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { formatPHP } from '@/lib/format'

interface Props {
  data: { name: string; revenue: number; profit: number }[]
}

function formatShort(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `₱${(value / 1_000).toFixed(0)}K`
  return `₱${value}`
}

export function ClientRevenueChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
        No client revenue data yet
      </div>
    )
  }

  const top = data.slice(0, 6)

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={top} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis
          type="number"
          tickFormatter={formatShort}
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={90}
        />
        <Tooltip
          contentStyle={{
            background: '#141820',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '12px',
          }}
          formatter={(value: number, name: string) => [
            formatPHP(String(value)),
            name === 'revenue' ? 'Revenue' : 'Profit',
          ]}
        />
        <Bar dataKey="revenue" fill="#10B981" radius={[0, 4, 4, 0]} barSize={14} />
        <Bar dataKey="profit"  fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={14} />
      </BarChart>
    </ResponsiveContainer>
  )
}
