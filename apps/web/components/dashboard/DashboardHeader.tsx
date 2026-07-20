'use client'
import { RefreshCw } from 'lucide-react'
import { timeAgo } from '@/lib/format'

interface Props {
  user:         { name: string; role: string }
  lastUpdated:  Date
  isFromCache?: boolean
  isMock?:      boolean
  onRefresh?:   () => void
  error?:       string | null
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function DashboardHeader({
  user, lastUpdated, isFromCache, isMock, onRefresh, error
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">
          {getGreeting()},{' '}
          <span className="text-emerald-400">{user.name.split(' ')[0]}</span>
        </h1>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          <p className="text-slate-500 text-sm">
            {user.role} · Updated {timeAgo(lastUpdated)}
          </p>
          {isFromCache && !isMock && (
            <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
              ⚡ cached
            </span>
          )}
          {isMock && (
            <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              demo data
            </span>
          )}
          {error && !isMock && (
            <span className="text-[10px] font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
              API error — showing demo
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="flex items-center gap-2 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-full px-4 py-2 text-slate-400 hover:text-white transition-all duration-200 text-xs font-medium"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        )}
        <div className="flex items-center gap-2 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-full px-3.5 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          <span className="text-emerald-400 text-xs font-bold tracking-wider">LIVE</span>
        </div>
      </div>
    </div>
  )
}
