'use client'
import { usePathname } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { MOCK_USER } from '@/lib/mockData'

const PAGE_LABELS: Record<string, string> = {
  '/':          'Dashboard',
  '/orders':    'Orders',
  '/reports':   'Reports',
  '/analytics': 'Analytics',
  '/clients':   'Clients',
}

interface Props {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function TopBar({ isCollapsed, onToggleCollapse }: Props) {
  const pathname = usePathname()
  const { user } = useAuth()
  const displayUser = user ?? MOCK_USER
  const initials = displayUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const pageLabel = PAGE_LABELS[pathname] ?? 'Dashboard'

  return (
    <div className="h-16 flex items-center justify-between gap-4 px-4 lg:px-6 border-b border-white/5 bg-[#0B0F1A]/80 backdrop-blur-sm sticky top-0 z-20 flex-shrink-0">
      {/* collapse toggle + breadcrumb — left padding on mobile clears the hamburger button */}
      <div className="flex items-center gap-3 min-w-0 pl-14 lg:pl-0">
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-md hover:bg-white/5 transition-colors flex-shrink-0"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-slate-500" />
          )}
        </button>

        <div className="flex items-center gap-1.5 text-sm min-w-0">
          <span className="text-slate-500 truncate">Finmark</span>
          <span className="text-slate-600">/</span>
          <span className="text-white font-medium truncate">{pageLabel}</span>
        </div>
      </div>

      {/* search */}
      <div className="hidden sm:flex items-center flex-1 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-white/5 border border-white/10 rounded-full pl-9 pr-3 py-2 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.07] transition-colors"
          />
        </div>
      </div>

      {/* avatar */}
      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {initials}
      </div>
    </div>
  )
}
