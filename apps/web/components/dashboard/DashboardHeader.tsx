'use client'
import { timeAgo } from '@/lib/format'

interface Props {
  user:         { name: string; role: string }
  lastUpdated:  Date
  isFromCache?: boolean
  isMock?:      boolean
  onRefresh?:   () => void
  error?:       string | null
}

export function DashboardHeader({
  user, lastUpdated, isFromCache, isMock, onRefresh, error
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-sm text-slate-400 font-medium tracking-widest uppercase mb-1">
          Finmark — Project Finer
        </p>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Good morning, <span className="text-emerald-400">{user.name.split(' ')[0]}</span>
        </h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <p className="text-slate-400 text-sm">
            {user.role} · Updated {timeAgo(lastUpdated)}
          </p>
          {isFromCache && !isMock && (
            <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
              Redis cached
            </span>
          )}
          {isMock && (
            <span className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              demo data
            </span>
          )}
          {error && !isMock && (
            <span className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
              API error — showing demo
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-4 py-2 text-slate-400 hover:text-white transition-all duration-200 text-xs font-medium"
          >
            ↻ Refresh
          </button>
        )}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-semibold tracking-wide">LIVE</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {user.name.split(' ').map((n: string) => n[0]).join('')}
        </div>
      </div>
    </div>
  )
}
