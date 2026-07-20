export interface NotificationPrefs {
  orderAlerts:    boolean
  reportDigests:  boolean
  systemUpdates:  boolean
}

export type AccentColor = 'emerald' | 'blue' | 'purple' | 'amber'

const KEY_NOTIFICATIONS = 'finmark_notification_prefs'
const KEY_ACCENT = 'finmark_accent'

const DEFAULT_NOTIFICATIONS: NotificationPrefs = {
  orderAlerts:   true,
  reportDigests: true,
  systemUpdates: false,
}

export const ACCENT_OPTIONS: Record<AccentColor, { label: string; value: string }> = {
  emerald: { label: 'Emerald', value: '#10b981' },
  blue:    { label: 'Blue',    value: '#3b82f6' },
  purple:  { label: 'Purple',  value: '#8b5cf6' },
  amber:   { label: 'Amber',   value: '#f59e0b' },
}

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof window === 'undefined') return DEFAULT_NOTIFICATIONS
  try {
    const raw = localStorage.getItem(KEY_NOTIFICATIONS)
    return raw ? { ...DEFAULT_NOTIFICATIONS, ...JSON.parse(raw) } : DEFAULT_NOTIFICATIONS
  } catch {
    return DEFAULT_NOTIFICATIONS
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs) {
  localStorage.setItem(KEY_NOTIFICATIONS, JSON.stringify(prefs))
}

export function getAccentColor(): AccentColor {
  if (typeof window === 'undefined') return 'emerald'
  return (localStorage.getItem(KEY_ACCENT) as AccentColor) || 'emerald'
}

export function saveAccentColor(color: AccentColor) {
  localStorage.setItem(KEY_ACCENT, color)
  applyAccentColor(color)
}

export function applyAccentColor(color: AccentColor = getAccentColor()) {
  const hex = ACCENT_OPTIONS[color].value
  document.documentElement.style.setProperty('--accent', hex)
  document.documentElement.style.setProperty('--accent-muted', `${hex}1f`)
}
