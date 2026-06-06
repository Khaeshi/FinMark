'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/',          label: 'Dashboard',  icon: '▦' },
  { href: '/orders',    label: 'Orders',     icon: '📦' },
  { href: '/reports',   label: 'Reports',    icon: '📊' },
  { href: '/analytics', label: 'Analytics',  icon: '📈' },
  { href: '/clients',   label: 'Clients',    icon: '🏢' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-16 lg:w-56 flex-shrink-0 flex flex-col border-r border-white/5 bg-[#080B14]">
      {/* logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
            <span className="text-white text-xs font-black">F</span>
          </div>
          <span className="hidden lg:block text-white font-bold text-sm tracking-tight">
            Fin<span className="text-emerald-400">mark</span>
          </span>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(item => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-base flex-shrink-0">{item.icon}</span>
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* bottom user area */}
      <div className="p-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">
            MC
          </div>
          <div className="hidden lg:block min-w-0">
            <p className="text-white text-xs font-medium truncate">Michael Cruz</p>
            <p className="text-slate-500 text-xs">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
