'use client'
import { formatPHP, formatNumber } from '@/lib/format'

interface Props {
  label: string
  value: string | number
  type: 'currency' | 'number'
  trend: number
  icon: string
  accent: string
}

export function MetricCard({ label, value, type, trend, icon, accent }: Props) {
  const display = type === 'currency'
    ? formatPHP(value as string)
    : formatNumber(value as number)

  const isPositive = trend >= 0

  return (
    <div
      className="relative rounded-2xl p-5 border border-white/5 overflow-hidden group hover:border-white/10 transition-all duration-300"
      style={{ background: 'rgba(255,255,255,0.03)' }}
    >
      {/* accent glow */}
      <div
        className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-10 blur-2xl group-hover:opacity-20 transition-opacity duration-300"
        style={{ background: accent }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="text-lg">{icon}</span>
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        </div>

        <p className="text-2xl font-bold text-white tracking-tight mb-1">
          {display}
        </p>
        <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">
          {label}
        </p>

        {/* bottom accent bar */}
        <div
          className="absolute bottom-0 left-0 h-0.5 w-full opacity-30 group-hover:opacity-60 transition-opacity"
          style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
        />
      </div>
    </div>
  )
}
