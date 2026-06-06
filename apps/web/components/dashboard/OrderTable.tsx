'use client'
import { formatPHP, timeAgo } from '@/lib/format'
import type { Order, OrderStatus } from '@finmark/shared'

interface Props { orders: Order[] }

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING:    'bg-amber-500/10 text-amber-400 border-amber-500/20',
  CONFIRMED:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  PROCESSING: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  FULFILLED:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  CANCELLED:  'bg-red-500/10 text-red-400 border-red-500/20',
  REFUNDED:   'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export function OrderTable({ orders }: Props) {
  return (
    <div className="rounded-2xl border border-white/5 p-5 h-full" style={{ background: 'rgba(255,255,255,0.03)' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-semibold text-base">Recent Orders</h2>
          <p className="text-slate-400 text-xs mt-0.5">Last {orders.length} transactions</p>
        </div>
        <button className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
          View all →
        </button>
      </div>

      <div className="space-y-3">
        {orders.map(order => (
          <div
            key={order.id}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 text-xs font-bold text-slate-400 group-hover:bg-white/10 transition-colors">
                {order.id.slice(-3).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-medium truncate max-w-[120px]">
                  {order.description || 'Order'}
                </p>
                <p className="text-slate-500 text-xs">{timeAgo(order.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-white text-xs font-semibold">
                {formatPHP(order.amount)}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[order.status]}`}>
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
