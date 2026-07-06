'use client'
import { useOrders } from '@/hooks/useOrders'
import { formatPHP, timeAgo } from '@/lib/format'
import { OrdersSkeleton } from '@/components/dashboard/OrdersSkeleton'
import type { OrderStatus } from '@finmark/shared'

const STATUS_STYLES: Record<string, string> = {
  PENDING:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CONFIRMED:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PROCESSING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  FULFILLED:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED:  'bg-red-500/10 text-red-400 border-red-500/20',
  REFUNDED:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const ALL_STATUSES: (OrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED']

export default function OrdersPage() {
  const { orders, total, isLoading, error, page, hasMore, setPage, setStatus, status } = useOrders()

  if (isLoading && orders.length === 0) return <OrdersSkeleton />

  return (
    <div className="p-6 lg:p-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Orders</h1>
          <p className="text-slate-400 text-sm mt-1">{total} total orders</p>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            <p className="text-red-400 text-sm">⚠ {error}</p>
          </div>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
              status === s
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
            }`}
          >
            {s === 'ALL' ? 'All Orders' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/5 overflow-hidden" style={{ background: 'rgba(255,255,255,0.03)' }}>
        {isLoading ? (
          <div className="p-12 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center gap-2">
            <span className="text-3xl">📦</span>
            <p className="text-slate-400 text-sm">No orders found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                {['Order ID', 'Client', 'Description', 'Amount', 'Status', 'Date'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-slate-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={order.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${i === orders.length - 1 ? 'border-none' : ''}`}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{order.id.slice(-8).toUpperCase()}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{order.clientId.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-sm text-white max-w-[200px] truncate">{order.description || '—'}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-white">{formatPHP(order.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${STATUS_STYLES[order.status] || ''}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(new Date(order.createdAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && orders.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">Page {page} · {orders.length} of {total}</p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >← Prev</button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!hasMore}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
            >Next →</button>
          </div>
        </div>
      )}
    </div>
  )
}
