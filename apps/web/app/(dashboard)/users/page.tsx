'use client'
import { useState } from 'react'
import { sileo } from 'sileo'
import { Plus, RefreshCw } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { useUsers } from '@/hooks/useUsers'
import { useClients } from '@/hooks/useClients'
import { canAccessUsersPage, USER_ROLES } from '@/lib/role-checks'
import { AccessRestricted } from '@/components/dashboard/AccessRestricted'
import { PermissionDenied } from '@/components/dashboard/PermissionDenied'
import { InviteUserModal } from '@/components/users/InviteUserModal'
import { isPermissionDenied } from '@/lib/api-errors'
import type { UserRole } from '@finmark/shared'

export default function UsersPage() {
  const { user } = useAuth()
  const { users, total, isLoading, error, refetch, updateRole, setActive, assignClient, mutatingId } = useUsers()
  const { clients } = useClients()
  const [showInvite, setShowInvite] = useState(false)

  const canAccess = canAccessUsersPage(user?.role)

  if (!canAccess) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Users</h1>
          <p className="text-slate-500 text-sm mt-1">Manage platform users and roles</p>
        </div>
        <AccessRestricted role={user?.role} requiredRole="ADMIN" />
      </div>
    )
  }

  if (!isLoading && isPermissionDenied(error)) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Users</h1>
          <p className="text-slate-500 text-sm mt-1">Manage platform users and roles</p>
        </div>
        <PermissionDenied />
      </div>
    )
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    const ok = await updateRole(userId, role)
    if (ok) sileo.success({ title: 'Role updated' })
  }

  async function handleAssign(userId: string, clientId: string) {
    if (!clientId) return
    const ok = await assignClient(userId, clientId)
    if (ok) sileo.success({ title: 'Client assigned' })
  }

  async function handleToggle(userId: string, currentlyActive: boolean) {
    const ok = await setActive(userId, !currentlyActive)
    if (ok) sileo.success({ title: currentlyActive ? 'User deactivated' : 'User reactivated' })
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Users</h1>
          <p className="text-slate-500 text-sm mt-1">{total} platform users</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetch(); sileo.success({ title: 'Users refreshed' }) }}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:bg-white/[0.07] hover:text-white transition-all"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
          <button
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-full bg-emerald-500 text-[#0d1117] font-semibold hover:bg-emerald-400 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Invite User
          </button>
        </div>
      </div>

      {error && !isPermissionDenied(error) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">⚠ {error}</p>
        </div>
      )}

      <div
        className="rounded-2xl border border-white/[0.06] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.025)' }}
      >
        {isLoading ? (
          <div className="p-16 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">No users found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Name', 'Email', 'Role', 'Client', 'Status', 'Active'].map(h => (
                    <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const busy = mutatingId === u.id
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-white/[0.04] ${i === users.length - 1 ? 'border-none' : ''}`}
                    >
                      <td className="px-5 py-4 text-sm font-medium text-white">{u.name}</td>
                      <td className="px-5 py-4 text-sm text-slate-400">{u.email}</td>
                      <td className="px-5 py-4">
                        <select
                          value={u.role}
                          disabled={busy || u.id === user?.id}
                          onChange={e => handleRoleChange(u.id, e.target.value as UserRole)}
                          className="text-xs font-semibold bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-emerald-500/50 disabled:opacity-40"
                        >
                          {USER_ROLES.map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={u.clientId || ''}
                          disabled={busy}
                          onChange={e => handleAssign(u.id, e.target.value)}
                          className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-500/50 disabled:opacity-40 max-w-[160px]"
                        >
                          <option value="">{u.client?.name || 'Unassigned'}</option>
                          {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-medium ${u.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggle(u.id, u.isActive)}
                          disabled={busy || u.id === user?.id}
                          className={`relative w-9 h-5 rounded-full transition-colors disabled:opacity-40 ${u.isActive ? 'bg-emerald-500' : 'bg-white/10'}`}
                          aria-label="Toggle active"
                        >
                          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${u.isActive ? 'left-4' : 'left-0.5'}`} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <InviteUserModal
        isOpen={showInvite}
        onClose={() => setShowInvite(false)}
        onSuccess={refetch}
      />
    </div>
  )
}
