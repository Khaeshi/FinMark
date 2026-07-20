'use client'
import { sileo } from 'sileo'
import { useClients } from '@/hooks/useClients'
import { ClientsSkeleton } from '@/components/dashboard/ClientsSkeleton'
import { PermissionDenied } from '@/components/dashboard/PermissionDenied'
import { isPermissionDenied } from '@/lib/api-errors'

const TIER_COLORS: Record<string, { badge: string; stat: string; avatar: string }> = {
  FREE:       { badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',       stat: 'text-slate-400',   avatar: 'from-slate-500 to-slate-600' },
  STARTER:    { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         stat: 'text-blue-400',    avatar: 'from-blue-500 to-blue-600' },
  GROWTH:     { badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20',   stat: 'text-purple-400',  avatar: 'from-purple-500 to-purple-600' },
  ENTERPRISE: { badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', stat: 'text-emerald-400', avatar: 'from-emerald-500 to-teal-600' },
}

function formatSinceDate(date: Date | string) {
  const d = new Date(date)
  return `Since ${d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
}

function getInitials(name: string) {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

export default function ClientsPage() {
  const { clients, total, isLoading, error, refetch } = useClients()

  if (isLoading && clients.length === 0 && !isPermissionDenied(error)) return <ClientsSkeleton />

  if (!isLoading && isPermissionDenied(error)) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">Client management</p>
        </div>
        <PermissionDenied />
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Clients</h1>
          <p className="text-slate-500 text-sm mt-1">{total} registered clients</p>
        </div>
        <button
          onClick={() => { refetch(); sileo.success({ title: 'Clients refreshed' }) }}
          className="text-xs px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] text-slate-400 hover:bg-white/[0.07] hover:text-white transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {error && !isPermissionDenied(error) && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">⚠ {error}</p>
        </div>
      )}

      {!isLoading && clients.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'] as const).map(tier => {
            const count = clients.filter(c => c.subscriptionTier === tier).length
            const colors = TIER_COLORS[tier]
            return (
              <div
                key={tier}
                className="rounded-2xl border border-white/[0.06] p-4 text-center"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                <p className={`text-3xl font-bold ${colors.stat}`}>{count}</p>
                <p className="text-[11px] text-slate-500 font-semibold tracking-[0.08em] uppercase mt-1">{tier}</p>
              </div>
            )
          })}
        </div>
      )}

      {isLoading ? (
        <div className="p-16 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div
          className="rounded-2xl border border-white/[0.06] p-16 flex flex-col items-center justify-center gap-3"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <p className="text-slate-400 text-sm">No clients found</p>
          <p className="text-slate-600 text-xs">Run db:seed to add sample SME clients</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {clients.map(client => {
            const tier = TIER_COLORS[client.subscriptionTier] || TIER_COLORS.FREE
            return (
              <div
                key={client.id}
                className="rounded-2xl border border-white/[0.06] p-5 hover:border-white/10 transition-all group"
                style={{ background: 'rgba(255,255,255,0.025)' }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${tier.avatar} flex items-center justify-center text-sm font-bold text-white flex-shrink-0`}>
                      {getInitials(client.name)}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full border ${tier.badge}`}>
                      {client.subscriptionTier}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${client.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                    <span className={`text-[11px] font-medium ${client.isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <h3 className="text-white font-semibold text-base mb-1 truncate">{client.name}</h3>
                <p className="text-slate-500 text-sm mb-4">{client.industry} · {client.country}</p>

                <div className="flex items-end justify-between pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-6">
                    <div>
                      <p className="text-lg font-bold text-white">{client._count?.users ?? 0}</p>
                      <p className="text-[10px] text-slate-500 font-semibold tracking-[0.08em] uppercase">Users</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-white">{client._count?.orders ?? 0}</p>
                      <p className="text-[10px] text-slate-500 font-semibold tracking-[0.08em] uppercase">Orders</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{formatSinceDate(client.createdAt)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
