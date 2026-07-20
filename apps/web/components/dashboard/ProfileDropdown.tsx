'use client'
import { useEffect, useRef, useState } from 'react'
import {
  User, Bell, KeyRound, Palette, Shield, HelpCircle, LogOut,
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { MOCK_USER } from '@/lib/mockData'

const MENU_ITEMS = [
  { icon: User,        label: 'View Profile',      desc: 'Personal info & avatar' },
  { icon: Bell,        label: 'Notifications',     desc: 'Alerts & preferences' },
  { icon: KeyRound,    label: 'Change Password',   desc: 'Security settings' },
  { icon: Palette,     label: 'Appearance',        desc: 'Theme & display' },
  { icon: Shield,      label: 'Security & 2FA',    desc: 'Authentication methods' },
  { icon: HelpCircle,  label: 'Help & Support',    desc: 'Docs & contact' },
] as const

export function ProfileDropdown() {
  const { user, logout } = useAuth()
  const displayUser = user ?? MOCK_USER
  const initials = displayUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
  const email = user?.email ?? MOCK_USER.email

  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-transparent hover:ring-emerald-500/30 transition-all"
        aria-label="Open profile menu"
      >
        {initials}
        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#0d1117]" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/10 bg-[#141820] shadow-2xl shadow-black/40 z-50 overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-white text-sm font-semibold truncate">{displayUser.name}</p>
                  <span className="text-[10px] font-bold tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    {displayUser.role}
                  </span>
                </div>
                <p className="text-slate-500 text-xs truncate mt-0.5">{email}</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            {MENU_ITEMS.map(({ icon: Icon, label, desc }) => (
              <button
                key={label}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="border-t border-white/5 py-1">
            <button
              onClick={() => { setOpen(false); logout() }}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/5 transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-red-400 text-sm font-medium">Sign out</p>
                <p className="text-slate-500 text-xs">End your session</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
