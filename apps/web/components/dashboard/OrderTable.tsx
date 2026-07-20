'use client'
import Link from 'next/link'
import { formatPHP, timeAgo } from '@/lib/format'
import type { Order, OrderStatus } from '@finmark/shared'

interface Props { orders: Order[] }

const STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING:    'text-amber-400',
  CONFIRMED:  'text-blue-400',
  PROCESSING: 'text-purple-400',
  FULFILLED:  'text-emerald-400',
  CANCELLED:  'text-red-400',
  REFUNDED:   'text-slate-400',
}

export function OrderTable({ orders }: Props) {
  return (
    <div
      className="rounded-2xl border border-white/[0.06] p-5 lg:p-6 h-full flex flex-col"
      style={{ background: 'rgba(255,255,255,0.025)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-white font-semibold text-base">Recent Orders</h2>
          <p className="text-slate-500 text-xs mt-0.5">Last {orders.length} transactions</p>
        </div>
        <Link
          href="/orders"
          className="text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="space-y-1 flex-1">
        {orders.map(order => (
          <div
            key={order.id}
            className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-white/[0.03] transition-colors group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-slate-500 group-hover:border-white/10 transition-colors">
                {order.id.slice(-4).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate max-w-[160px]">
                  {order.description || 'Order'}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{timeAgo(order.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span className="text-white text-sm font-semibold">
                {formatPHP(order.amount)}
              </span>
              <span className={`text-[10px] font-bold tracking-wide uppercase ${STATUS_COLORS[order.status]}`}>
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
