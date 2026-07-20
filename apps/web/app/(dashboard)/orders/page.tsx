'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sileo } from 'sileo'
import { Plus } from 'lucide-react'
import { useOrders } from '@/hooks/useOrders'
import { useUpdateOrderStatus } from '@/hooks/useUpdateOrderStatus'
import { useAuth } from '@/lib/auth-context'
import { formatPHP } from '@/lib/format'
import { canCreateOrders, ORDER_STATUS_TRANSITIONS } from '@/lib/role-checks'
import { OrdersSkeleton } from '@/components/dashboard/OrdersSkeleton'
import { PermissionDenied } from '@/components/dashboard/PermissionDenied'
import { CreateOrderModal } from '@/components/orders/CreateOrderModal'
import { isPermissionDenied } from '@/lib/api-errors'
import type { OrderStatus } from '@finmark/shared'

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'text-amber-400',
  CONFIRMED:  'text-blue-400',
  PROCESSING: 'text-purple-400',
  FULFILLED:  'text-emerald-400',
  CANCELLED:  'text-red-400',
  REFUNDED:   'text-slate-400',
}

const ALL_STATUSES: (OrderStatus | 'ALL')[] = [
  'ALL', 'PENDING', 'CONFIRMED', 'PROCESSING', 'FULFILLED', 'CANCELLED', 'REFUNDED',
]

type OrderRow = {
  id: string
  clientId: string
  status: OrderStatus
  amount: string
  currency: string
  description?: string | null
  createdAt: Date | string
  client?: { name: string; industry: string }
  flagged?: boolean
  flagReason?: string | null
}

function formatOrderDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function OrdersPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { orders, total, isLoading, error, page, hasMore, setPage, setStatus, status, refetch } = useOrders()
  const { updateStatus, cancelOrder, isLoading: mutating, updatingId, error: mutateError } = useUpdateOrderStatus()
  const [showCreate, setShowCreate] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const canCreate = canCreateOrders(user?.role)

  if (isLoading && orders.length === 0 && !isPermissionDenied(error)) return <OrdersSkeleton />

  if (!isLoading && isPermissionDenied(error)) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Orders</h1>
          <p className="text-slate-500 text-sm mt-1">Order management</p>
        </div>
        <PermissionDenied />
      </div>
    )
  }

  const totalPages = Math.max(1, Math.ceil(total / 20))
  const typedOrders = orders as OrderRow[]

  async function handleStatusChange(orderId: string, next: OrderStatus) {
    const ok = await updateStatus(orderId, next)
    if (ok) {
      sileo.success({ title: `Status → ${next}` })
      refetch()
    }
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return
    const ok = await cancelOrder(cancelTarget, cancelReason.trim() || undefined)
    if (ok) {
      sileo.success({ title: 'Order cancelled' })
      setCancelTarget(null)
      setCancelReason('')
      refetch()
    }
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-white tracking-tight">Orders</h1>
          <p className="text-slate-500 text-sm mt-1">{total} total orders</p>
        </div>
        <div className="flex items-center gap-2">
          {(error || mutateError) && !isPermissionDenied(error) && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">
              <p className="text-red-400 text-sm">⚠ {error || mutateError}</p>
            </div>
          )}
          {canCreate && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-full bg-emerald-500 text-[#0d1117] font-semibold hover:bg-emerald-400 transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              New Order
            </button>
          )}
        </div>
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
        ) : typedOrders.length === 0 ? (
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
                    {['Order ID', 'Client', 'Description', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-[0.08em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {typedOrders.map((order, i) => {
                    const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status] || []
                    const canCancel = nextStatuses.includes('CANCELLED')
                    return (
                      <tr
                        key={order.id}
                        className={`border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer ${i === typedOrders.length - 1 ? 'border-none' : ''}`}
                        onClick={() => router.push(`/orders/${order.id}`)}
                      >
                        <td className="px-5 py-4 font-mono text-xs text-slate-400">
                          ORD-{order.id.slice(-4).toUpperCase()}
                        </td>
                        <td className="px-5 py-4 text-sm font-medium text-white">
                          {order.client?.name || `${order.clientId.slice(0, 8)}…`}
                        </td>
                        <td className="px-5 py-4 text-sm text-slate-400 max-w-[220px] truncate">{order.description || '—'}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-white">
                          <div className="flex flex-col gap-1">
                            <span>{formatPHP(order.amount)}</span>
                            {order.flagged && (
                              <span
                                title={order.flagReason || 'Unusual amount'}
                                className="inline-flex w-fit text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20"
                              >
                                ⚠ Unusual amount
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          {canCreate && nextStatuses.filter(s => s !== 'CANCELLED').length > 0 ? (
                            <select
                              value={order.status}
                              disabled={mutating && updatingId === order.id}
                              onChange={e => handleStatusChange(order.id, e.target.value as OrderStatus)}
                              className={`text-xs font-bold tracking-wide uppercase bg-transparent border border-white/10 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-500/50 ${STATUS_COLORS[order.status] || 'text-slate-400'}`}
                            >
                              <option value={order.status}>{order.status}</option>
                              {nextStatuses.filter(s => s !== 'CANCELLED').map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          ) : (
                            <span className={`text-xs font-bold tracking-wide uppercase ${STATUS_COLORS[order.status] || 'text-slate-400'}`}>
                              {order.status}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs text-slate-500">{formatOrderDate(order.createdAt)}</td>
                        <td className="px-5 py-4" onClick={e => e.stopPropagation()}>
                          {canCreate && canCancel && (
                            <button
                              onClick={() => { setCancelTarget(order.id); setCancelReason('') }}
                              disabled={mutating && updatingId === order.id}
                              className="text-xs font-medium text-red-400 hover:text-red-300 disabled:opacity-40 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
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

      <CreateOrderModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={refetch}
      />

      {cancelTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setCancelTarget(null)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-[#141820] p-5 space-y-4">
            <h3 className="text-white font-semibold">Cancel order</h3>
            <p className="text-slate-400 text-sm">Optionally provide a reason for cancellation.</p>
            <input
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              placeholder="Reason…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500/50"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/5"
              >
                Keep order
              </button>
              <button
                onClick={handleCancelConfirm}
                disabled={mutating}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
              >
                Confirm cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
