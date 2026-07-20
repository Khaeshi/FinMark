import { ShieldOff } from 'lucide-react'
import type { UserRole } from '@finmark/shared'

interface Props {
  role?:         UserRole | null
  requiredRole?: string
  message?:      string
}

export function AccessRestricted({
  role,
  requiredRole = 'ADMIN',
  message,
}: Props) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-10 flex flex-col items-center justify-center text-center gap-3">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
        <ShieldOff className="h-6 w-6 text-amber-400" />
      </div>
      <div>
        <p className="text-white font-semibold text-base">Access restricted</p>
        <p className="text-slate-400 text-sm mt-1 max-w-md">
          {message ??
            `This area requires ${requiredRole} privileges${role ? ` (your role: ${role})` : ''}.`}
        </p>
      </div>
    </div>
  )
}
