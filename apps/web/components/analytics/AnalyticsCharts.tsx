'use client'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

interface PeriodPoint {
  period: string
  orders: number
}

interface Props {
  data: PeriodPoint[]
}

export function OrdersByPeriodChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
        No order period data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            background: '#141820',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '12px',
          }}
        />
        <Bar dataKey="orders" fill="#10B981" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}

interface TrendPoint {
  period: string
  [clientName: string]: string | number
}

interface TrendProps {
  data: TrendPoint[]
  clients: string[]
}

const LINE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EF4444', '#14B8A6']

export function RevenueTrendChart({ data, clients }: TrendProps) {
  if (data.length === 0 || clients.length === 0) {
    return (
      <div className="flex items-center justify-center h-[220px] text-slate-500 text-sm">
        No revenue trend data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis dataKey="period" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
        <Tooltip
          contentStyle={{
            background: '#141820',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '12px',
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
        {clients.slice(0, 6).map((name, i) => (
          <Line
            key={name}
            type="monotone"
            dataKey={name}
            stroke={LINE_COLORS[i % LINE_COLORS.length]}
            strokeWidth={2}
            dot={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}

interface HeatCell {
  day: string
  hour: number
  count: number
}

interface HeatmapProps {
  data: HeatCell[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = [0, 3, 6, 9, 12, 15, 18, 21]

export function PeakOrderHeatmap({ data }: HeatmapProps) {
  const max = Math.max(1, ...data.map(d => d.count))

  function intensity(day: string, hour: number) {
    const cell = data.find(d => d.day === day && d.hour === hour)
    return cell ? cell.count / max : 0
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px] text-slate-500 text-sm">
        No peak-time data yet
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <div className="inline-grid gap-1" style={{ gridTemplateColumns: `40px repeat(${HOURS.length}, minmax(28px, 1fr))` }}>
        <div />
        {HOURS.map(h => (
          <div key={h} className="text-[10px] text-slate-500 text-center">{h}h</div>
        ))}
        {DAYS.map(day => (
          <div key={day} className="contents">
            <div className="text-[10px] text-slate-500 flex items-center">{day}</div>
            {HOURS.map(hour => {
              const t = intensity(day, hour)
              return (
                <div
                  key={`${day}-${hour}`}
                  title={`${day} ${hour}:00 — ${Math.round(t * max)} orders`}
                  className="h-7 rounded-md"
                  style={{
                    background: t === 0
                      ? 'rgba(255,255,255,0.03)'
                      : `rgba(16, 185, 129, ${0.15 + t * 0.85})`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
