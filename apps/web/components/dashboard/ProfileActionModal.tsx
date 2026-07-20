'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2 } from 'lucide-react'
import { sileo } from 'sileo'
import { useAuth } from '@/lib/auth-context'
import { fetchUserProfile, forgotPasswordRequest, logoutRequest, type UserProfile } from '@/lib/api-client'
import {
  getNotificationPrefs, saveNotificationPrefs,
  getAccentColor, saveAccentColor, ACCENT_OPTIONS,
  type NotificationPrefs, type AccentColor,
} from '@/lib/user-preferences'

export type ProfilePanel =
  | 'profile'
  | 'notifications'
  | 'password'
  | 'appearance'
  | 'security'
  | 'help'

const PANEL_TITLES: Record<ProfilePanel, string> = {
  profile:       'View Profile',
  notifications: 'Notifications',
  password:      'Change Password',
  appearance:    'Appearance',
  security:      'Security & 2FA',
  help:          'Help & Support',
}

interface Props {
  panel:   ProfilePanel
  onClose: () => void
}

export function ProfileActionModal({ panel, onClose }: Props) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#141820] shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h2 className="text-white font-semibold text-base">{PANEL_TITLES[panel]}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {panel === 'profile'       && <ProfilePanel onClose={onClose} />}
          {panel === 'notifications' && <NotificationsPanel />}
          {panel === 'password'      && <PasswordPanel />}
          {panel === 'appearance'    && <AppearancePanel />}
          {panel === 'security'      && <SecurityPanel />}
          {panel === 'help'          && <HelpPanel />}
        </div>
      </div>
    </div>,
    document.body
  )
}

function ProfilePanel({ onClose }: { onClose: () => void }) {
  const { user, tokens, refreshProfile, logout } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!tokens?.accessToken) { setLoading(false); return }
    fetchUserProfile(tokens.accessToken)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [tokens?.accessToken])

  async function handleRefresh() {
    setLoading(true)
    await refreshProfile()
    if (tokens?.accessToken) {
      try {
        setProfile(await fetchUserProfile(tokens.accessToken))
        sileo.success({ title: 'Profile updated' })
      } catch {
        sileo.error({ title: 'Could not refresh profile' })
      }
    }
    setLoading(false)
  }

  async function handleSignOut() {
    onClose()
    if (tokens?.accessToken) {
      try { await logoutRequest(tokens.accessToken) } catch { /* non-fatal */ }
    }
    logout()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 text-emerald-400 animate-spin" />
      </div>
    )
  }

  const display = profile ?? user
  if (!display) {
    return <p className="text-slate-400 text-sm text-center py-8">No profile data available.</p>
  }

  const rows = [
    { label: 'Name',  value: display.name },
    { label: 'Email', value: display.email },
    { label: 'Role',  value: display.role },
    ...(profile?.client ? [{ label: 'Client', value: profile.client.name }] : []),
    ...(profile ? [{ label: 'Status', value: profile.isActive ? 'Active' : 'Inactive' }] : []),
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b border-white/5">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white text-lg font-bold">
          {display.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
        </div>
        <div>
          <p className="text-white font-semibold">{display.name}</p>
          <p className="text-slate-500 text-sm">{display.email}</p>
        </div>
      </div>

      <dl className="space-y-3">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex justify-between gap-4">
            <dt className="text-slate-500 text-sm">{label}</dt>
            <dd className="text-white text-sm font-medium text-right">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleRefresh}
          className="flex-1 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/[0.07] transition-colors"
        >
          Refresh profile
        </button>
        <button
          onClick={handleSignOut}
          className="flex-1 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/15 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}

function ToggleRow({
  label, desc, checked, onChange,
}: {
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 border-b border-white/[0.04] last:border-0 cursor-pointer">
      <div>
        <p className="text-white text-sm font-medium">{label}</p>
        <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-emerald-500' : 'bg-white/10'
        }`}
      >
        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'left-6' : 'left-1'
        }`} />
      </button>
    </label>
  )
}

function NotificationsPanel() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(getNotificationPrefs)

  function update(key: keyof NotificationPrefs, value: boolean) {
    const next = { ...prefs, [key]: value }
    setPrefs(next)
    saveNotificationPrefs(next)
    sileo.success({ title: 'Preferences saved' })
  }

  return (
    <div>
      <p className="text-slate-400 text-sm mb-4">Choose which alerts you receive in Finmark.</p>
      <ToggleRow label="Order alerts"     desc="New orders and status changes"  checked={prefs.orderAlerts}   onChange={v => update('orderAlerts', v)} />
      <ToggleRow label="Report digests"   desc="Weekly financial summaries"      checked={prefs.reportDigests} onChange={v => update('reportDigests', v)} />
      <ToggleRow label="System updates"   desc="Platform maintenance notices"    checked={prefs.systemUpdates} onChange={v => update('systemUpdates', v)} />
    </div>
  )
}

function PasswordPanel() {
  const { user } = useAuth()
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSendReset() {
    if (!user?.email) return
    setSending(true)
    try {
      await forgotPasswordRequest(user.email)
      setSent(true)
      sileo.success({ title: 'Reset code sent', description: 'Check your email inbox' })
    } catch {
      sileo.error({ title: 'Could not send reset code' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">
        Password changes are verified via email. We&apos;ll send a reset code to{' '}
        <span className="text-white">{user?.email}</span>.
      </p>
      {sent ? (
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
          <p className="text-emerald-400 text-sm font-medium">Reset code sent</p>
          <p className="text-slate-400 text-xs mt-1">Follow the instructions in your email to set a new password.</p>
        </div>
      ) : (
        <button
          onClick={handleSendReset}
          disabled={sending}
          className="w-full py-2.5 rounded-xl bg-emerald-500 text-[#0d1117] text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          Send reset code
        </button>
      )}
    </div>
  )
}

function AppearancePanel() {
  const [accent, setAccent] = useState<AccentColor>(getAccentColor)

  function select(color: AccentColor) {
    setAccent(color)
    saveAccentColor(color)
    sileo.success({ title: 'Theme updated' })
  }

  return (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm">Pick an accent color for buttons, badges, and highlights.</p>
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(ACCENT_OPTIONS) as [AccentColor, { label: string; value: string }][]).map(([key, { label, value }]) => (
          <button
            key={key}
            onClick={() => select(key)}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
              accent === key
                ? 'border-white/20 bg-white/[0.06]'
                : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
            }`}
          >
            <span className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: value }} />
            <span className="text-white text-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function SecurityPanel() {
  const { user } = useAuth()

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-2">
        <p className="text-white text-sm font-medium">Account role</p>
        <p className="text-emerald-400 text-xs font-bold tracking-wide uppercase">{user?.role ?? '—'}</p>
      </div>
      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
        <p className="text-white text-sm font-medium mb-1">Two-factor authentication</p>
        <p className="text-slate-400 text-xs leading-relaxed">
          MFA is managed through AWS Cognito. Contact your administrator to enable authenticator app or SMS verification for your account.
        </p>
      </div>
      <p className="text-slate-500 text-xs">
        Sessions expire after 8 hours. Sign out on shared devices when finished.
      </p>
    </div>
  )
}

function HelpPanel() {
  return (
    <div className="space-y-3">
      <p className="text-slate-400 text-sm mb-4">Need assistance with Finmark?</p>
      <a
        href="mailto:support@finmark.app?subject=Finmark%20Support"
        className="block w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 text-sm font-medium text-center hover:bg-white/[0.07] transition-colors"
      >
        Email support
      </a>
      <a
        href="/settings"
        className="block w-full py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 text-sm font-medium text-center hover:bg-white/[0.07] transition-colors"
      >
        Open settings
      </a>
      <p className="text-slate-600 text-xs text-center pt-2">Finmark v0.1 · SME financial platform</p>
    </div>
  )
}
