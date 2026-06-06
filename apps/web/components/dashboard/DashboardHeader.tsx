'use client'
import { timeAgo } from '@/lib/format'

interface Props {
  user: { name: string; role: string }
  lastUpdated: Date
}

export function DashboardHeader({ user, lastUpdated }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <p className="text-sm text-slate-400 font-medium tracking-widest uppercase mb-1">
          Finmark — Project Finer
        </p>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Good morning, <span className="text-emerald-400">{user.name.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {user.role} · Data refreshed {timeAgo(lastUpdated)}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* live indicator */}
        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 text-xs font-semibold tracking-wide">LIVE</span>
        </div>

        {/* avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
          {user.name.split(' ').map(n => n[0]).join('')}
        </div>
      </div>
    </div>
  )
}
