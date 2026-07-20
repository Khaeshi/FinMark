'use client'
import { useOrders } from '@/hooks/useOrders'
import { formatPHP } from '@/lib/format'
import { OrdersSkeleton } from '@/components/dashboard/OrdersSkeleton'
import type { OrderStatus } from '@finmark/shared'

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'text-amber-400',
  CONFIRMED:  'text-blue-400',
  PROCESSING: 'text-purple-400',
  FULFILLED:  'text-emerald-400',
  CANCELLED:  'text-red-400',
  REFUNDED:   'text-slate-400',
}

const ALL_STATUSES: (OrderStatus | 'ALL')[] = ['ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED']

function formatOrderDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OrdersPage() {
  const { orders, total, isLoading, error, page, hasMore, setPage, setStatus, status } = useOrders()

  if (isLoading && orders.length === 0) return <OrdersSkeleton />

  const totalPages = Math.max(1, Math.ceil(total / 10))

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Orders</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total orders</p>
        </div>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
            <p className="text-red-400 text-sm">⚠ {error}</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 flex-wrap">
        {ALL_STATUSES.map(s => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
              status === s
                ? 'bg-emerald-500 text-[#0d1117] border-emerald-500'
                : 'bg-white/[0.03] text-slate-400 border-white/[0.08] hover:bg-white/[0.06] hover:text-slate-300'
            }`}
          >
            {s === 'ALL' ? 'All Orders' : s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <div
        className="rounded-2xl border border-white/[0.06] overflow-hidden"
        style={{ background: 'rgba(255,255,255,0.025)' }}
      >
        {isLoading ? (
          <div className="p-16 flex items-center justify-center">
            <span className="w-6 h-6 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2">
            <PackageIcon />
            <p className="text-slate-400 text-sm">No orders found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['Order ID', 'Client', 'Description', 'Amount', 'Status', 'Date'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, i) => (
                    <tr
                      key={order.id}
                      className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors ${i === orders.length - 1 ? 'border-none' : ''}`}
                    >
                      <td className="px-5 py-4 font-mono text-xs text-slate-400">
                        ORD-{order.id.slice(-4).toUpperCase()}
                      </td>
                      <td className="px-5 py-4 text-sm font-medium text-white">{order.clientId.slice(0, 8)}...</td>
                      <td className="px-5 py-4 text-sm text-slate-400 max-w-[220px] truncate">{order.description || '—'}</td>
                      <td className="px-5 py-4 text-sm font-semibold text-white">{formatPHP(order.amount)}</td>
                      <td className="px-5 py-4">
                        <span className={`text-xs font-bold tracking-wide uppercase ${STATUS_COLORS[order.status] || 'text-slate-400'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">{formatOrderDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between px-5 py-4 border-t border-white/[0.06]">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="text-xs font-medium text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span className="text-xs text-slate-500">Page {page} of {totalPages}</span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!hasMore}
                className="text-xs font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PackageIcon() {
  return (
    <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )
}
