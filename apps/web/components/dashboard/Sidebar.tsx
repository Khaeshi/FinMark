'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  BarChart3,
  LineChart,
  Building2,
  Menu,
  X,
  LogOut,
  Users,
  Settings,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { MOCK_USER } from '@/lib/mockData'
import { useHoverIntent } from '@/hooks/useHoverIntent'
import { prefetchRoute } from '@/lib/routePrefetch'

type NavEntry =
  | { type: 'link';    href: string; label: string; icon: React.ComponentType<{ className?: string }> }
  | { type: 'section'; label: string }

const NAV: NavEntry[] = [
  { type: 'link',    href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { type: 'link',    href: '/analytics', label: 'Analytics', icon: LineChart },
  { type: 'section', label: 'WORKSPACE' },
  { type: 'link',    href: '/orders',    label: 'Orders',    icon: Package },
  { type: 'link',    href: '/clients',   label: 'Clients',   icon: Building2 },
  { type: 'link',    href: '/reports',   label: 'Reports',   icon: BarChart3 },
  { type: 'section', label: 'ADMIN' },
  { type: 'link',    href: '/users',     label: 'Users',     icon: Users },
  { type: 'link',    href: '/settings',  label: 'Settings',  icon: Settings },
]

function NavItem({
  href, label, Icon, active, isCollapsed, token, onNavigate,
}: {
  href: string
  label: string
  Icon: React.ComponentType<{ className?: string }>
  active: boolean
  isCollapsed: boolean
  token?: string | null
  onNavigate: () => void
}) {
  const router = useRouter()

  const { onMouseEnter, onMouseLeave, onTouchStart } = useHoverIntent(
    useCallback(() => {
      router.prefetch(href)
      prefetchRoute(href, token)
    }, [router, href, token])
  )

  return (
    <li className="relative group">
      <Link
        href={href}
        onClick={onNavigate}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onTouchStart={onTouchStart}
        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
          isCollapsed ? 'justify-center px-2' : ''
        } ${
          active
            ? 'bg-emerald-500/[0.08] text-emerald-400'
            : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
        }`}
      >
        {active && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-emerald-400 rounded-full" />
        )}
        <Icon className={`h-[18px] w-[18px] flex-shrink-0 ${active ? 'text-emerald-400' : ''}`} />
        {!isCollapsed && <span>{label}</span>}
      </Link>

      {isCollapsed && (
        <div className="hidden lg:group-hover:flex absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1.5 bg-[#141820] text-white text-xs font-medium rounded-lg border border-white/10 whitespace-nowrap z-50 shadow-xl">
          {label}
        </div>
      )}
    </li>
  )
}

export function Sidebar({ isCollapsed }: { isCollapsed: boolean }) {
  const pathname = usePathname()
  const { user, tokens, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsOpen(true)
      else setIsOpen(false)
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => setIsOpen(o => !o)
  const closeOnMobileNav = () => { if (window.innerWidth < 1024) setIsOpen(false) }

  const displayUser = user ?? MOCK_USER
  const initials = displayUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-[#080b12] border border-white/10 shadow-lg lg:hidden"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="h-5 w-5 text-slate-300" /> : <Menu className="h-5 w-5 text-slate-300" />}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full flex flex-col border-r border-white/[0.06] bg-[#080b12] z-40
          transition-all duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isCollapsed ? 'w-[72px]' : 'w-60'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        <div className="h-16 flex items-center px-4 border-b border-white/[0.06] flex-shrink-0">
          <div className={`flex items-center gap-2.5 ${isCollapsed ? 'w-full justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/20">
              <span className="text-white text-xs font-black">F</span>
            </div>
            {!isCollapsed && (
              <span className="text-white font-bold text-[15px] tracking-tight">
                Fin<span className="text-emerald-400">mark</span>
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-0.5">
            {NAV.map((item, i) => {
              if (item.type === 'section') {
                return (
                  <li
                    key={`section-${item.label}`}
                    className={`px-3 ${i === 0 ? 'pt-1' : 'pt-5'} pb-2`}
                  >
                    {!isCollapsed ? (
                      <span className="text-[10px] font-semibold tracking-[0.12em] text-slate-600 uppercase">
                        {item.label}
                      </span>
                    ) : (
                      <div className="h-px bg-white/[0.06] mx-1" />
                    )}
                  </li>
                )
              }
              return (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  Icon={item.icon}
                  active={pathname === item.href}
                  isCollapsed={isCollapsed}
                  token={tokens?.accessToken}
                  onNavigate={closeOnMobileNav}
                />
              )
            })}
          </ul>
        </nav>

        <div className="border-t border-white/[0.06] p-3 flex-shrink-0 space-y-1">
          <div className={`flex items-center gap-3 px-2 py-2 ${isCollapsed ? 'justify-center px-0' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <p className="text-white text-xs font-semibold truncate">{displayUser.name}</p>
                <p className="text-slate-500 text-[10px] font-medium tracking-wide uppercase">{displayUser.role}</p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            title={isCollapsed ? 'Logout' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-red-400/80 hover:bg-red-500/[0.08] hover:text-red-400 transition-all duration-200 ${
              isCollapsed ? 'justify-center px-0' : ''
            }`}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
