'use client'
import { useClients } from '@/hooks/useClients'
import { timeAgo } from '@/lib/format'

const TIER_STYLES: Record<string, string> = {
  FREE:       'bg-slate-500/10 text-slate-400 border-slate-500/20',
  STARTER:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  GROWTH:     'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ENTERPRISE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
}

export default function ClientsPage() {
  const { clients, total, isLoading, error, refetch } = useClients()

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-400 font-medium tracking-widest uppercase mb-1">Finmark — Project Finer</p>
          <h1 className="text-2xl font-bold text-white">SME Clients</h1>
          <p className="text-slate-400 text-sm mt-1">{total} clients across Southeast Asia</p>
        </div>
        <button
          onClick={refetch}
          className="text-xs px-4 py-2 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">⚠ {error}</p>
        </div>
      )}

      {/* Stats row */}
      {!isLoading && clients.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'] as const).map(tier => {
            const count = clients.filter(c => c.subscriptionTier === tier).length
            return (
              <div key={tier} className="rounded-2xl border border-white/5 p-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">{tier}</p>
                <p className="text-2xl font-bold text-white">{count}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Client cards */}
      {isLoading ? (
        <div className="p-12 flex items-center justify-center">
          <span className="w-6 h-6 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
        </div>
      ) : clients.length === 0 ? (
        <div className="rounded-2xl border border-white/5 p-12 flex flex-col items-center justify-center gap-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <span className="text-3xl">🏢</span>
          <p className="text-slate-400 text-sm">No clients found</p>
          <p className="text-slate-600 text-xs">Run db:seed to add sample SME clients</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map(client => (
            <div
              key={client.id}
              className="rounded-2xl border border-white/5 p-5 hover:border-white/10 transition-all group"
              style={{ background: 'rgba(255,255,255,0.03)' }}
            >
              {/* Top row */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                  {client.name.charAt(0)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${TIER_STYLES[client.subscriptionTier] || TIER_STYLES.FREE}`}>
                    {client.subscriptionTier}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${client.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} title={client.isActive ? 'Active' : 'Inactive'} />
                </div>
              </div>

              {/* Client info */}
              <h3 className="text-white font-semibold text-sm mb-1 truncate">{client.name}</h3>
              <p className="text-slate-400 text-xs mb-3">{client.industry} · {client.country}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 pt-3 border-t border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-xs">👥</span>
                  <span className="text-xs text-slate-400">{client._count?.users ?? 0} users</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-xs">📦</span>
                  <span className="text-xs text-slate-400">{client._count?.orders ?? 0} orders</span>
                </div>
                <span className="text-xs text-slate-600 ml-auto">{timeAgo(new Date(client.createdAt))}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
