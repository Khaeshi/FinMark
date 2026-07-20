'use client'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatPHP, formatNumber } from '@/lib/format'

interface Props {
  label: string
  value: string | number
  type: 'currency' | 'number' | 'percent'
  trend: number
  icon: React.ReactNode
  accent: string
}

export function MetricCard({ label, value, type, trend, icon, accent }: Props) {
  const display = type === 'currency'
    ? formatPHP(value as string)
    : type === 'percent'
      ? `${Math.round(value as number)}%`
      : formatNumber(value as number)

  const isPositive = trend >= 0

  return (
    <div
      className="relative rounded-2xl p-5 border border-white/[0.06] overflow-hidden group hover:border-white/10 transition-all duration-300"
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      <div
        className="absolute -top-8 -right-8 w-28 h-28 rounded-full opacity-[0.07] blur-2xl group-hover:opacity-[0.12] transition-opacity duration-300"
        style={{ background: accent }}
      />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-base"
            style={{ background: `${accent}18`, color: accent }}
          >
            {icon}
          </div>
          <span
            className={`flex items-center gap-0.5 text-[11px] font-semibold px-2 py-1 rounded-full ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        </div>

        <p className="text-[22px] font-bold text-white tracking-tight mb-1">
          {display}
        </p>
        <p className="text-[11px] text-slate-500 font-semibold tracking-[0.08em] uppercase">
          {label}
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-70 transition-opacity"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent 80%)` }}
      />
    </div>
  )
}
