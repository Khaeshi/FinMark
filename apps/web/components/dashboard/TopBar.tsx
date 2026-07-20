'use client'
import { usePathname } from 'next/navigation'
import { Search, ChevronLeft, ChevronRight, Bell } from 'lucide-react'
import { ProfileDropdown } from '@/components/dashboard/ProfileDropdown'

const PAGE_LABELS: Record<string, string> = {
  '/':          'Dashboard',
  '/orders':    'Orders',
  '/reports':   'Reports',
  '/analytics': 'Analytics',
  '/clients':   'Clients',
  '/settings':  'Settings',
  '/users':     'Users',
}

interface Props {
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export function TopBar({ isCollapsed, onToggleCollapse }: Props) {
  const pathname = usePathname()
  const pageLabel = PAGE_LABELS[pathname] ?? 'Dashboard'

  return (
    <div className="h-16 flex items-center gap-4 px-4 lg:px-6 border-b border-white/[0.06] bg-[#0d1117]/90 backdrop-blur-md sticky top-0 z-20 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0 pl-14 lg:pl-0 flex-shrink-0">
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/5 transition-colors flex-shrink-0"
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

      <div className="hidden sm:flex items-center flex-1 justify-center max-w-md mx-auto">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-full pl-9 pr-4 py-2 text-xs text-slate-300 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/30 focus:bg-white/[0.06] transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0 ml-auto">
        <button
          className="relative p-2 rounded-lg hover:bg-white/5 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4 text-slate-400" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500" />
        </button>
        <ProfileDropdown />
      </div>
    </div>
  )
}
