'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  PENDING:    '#F59E0B',
  CONFIRMED:  '#3B82F6',
  PROCESSING: '#8B5CF6',
  FULFILLED:  '#10B981',
  CANCELLED:  '#EF4444',
  REFUNDED:   '#64748B',
}

interface Props {
  data: { status: string; count: number }[]
}

export function OrderStatusChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
        No order data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="status"
          tick={{ fill: '#64748b', fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={s => s.charAt(0) + s.slice(1).toLowerCase()}
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={30}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: '#141820',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map(entry => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#64748B'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
