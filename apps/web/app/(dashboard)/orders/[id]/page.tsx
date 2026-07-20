'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { formatPHP } from '@/lib/format'
import { parseApiResponseError } from '@/lib/api-errors'
import type { OrderStatus } from '@finmark/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

const STATUS_COLORS: Record<string, string> = {
  PENDING:    'text-amber-400 bg-amber-500/10 border-amber-500/20',
  CONFIRMED:  'text-blue-400 bg-blue-500/10 border-blue-500/20',
  PROCESSING: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  FULFILLED:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  CANCELLED:  'text-red-400 bg-red-500/10 border-red-500/20',
  REFUNDED:   'text-slate-400 bg-slate-500/10 border-slate-500/20',
}

interface OrderDetail {
  id: string
  clientId: string
  status: OrderStatus
  amount: string
  currency: string
  description?: string | null
  metadata?: Record<string, unknown> | null
  createdAt: string
  updatedAt: string
  client?: { name: string; industry: string; country: string }
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { tokens } = useAuth()
  const orderId = params.id as string

  const [order, setOrder]     = useState<OrderDetail | null>(null)
  const [isLoading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    if (!tokens?.accessToken || !orderId) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        })
        if (!res.ok) throw new Error(await parseApiResponseError(res))
        const json = await res.json()
        if (!cancelled) setOrder(json.data)
      } catch (err: unknown) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [tokens?.accessToken, orderId])

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[40vh]">
        <span className="w-6 h-6 border-2 border-white/10 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6 lg:p-8 space-y-4">
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
        <p className="text-red-400 text-sm">{error || 'Order not found'}</p>
      </div>
    )
  }

  const rows = [
    { label: 'Order ID', value: order.id },
    { label: 'Client', value: order.client?.name || order.clientId },
    { label: 'Industry', value: order.client?.industry || '—' },
    { label: 'Amount', value: formatPHP(order.amount) },
    { label: 'Currency', value: order.currency },
    { label: 'Description', value: order.description || '—' },
    { label: 'Created', value: new Date(order.createdAt).toLocaleString() },
    { label: 'Updated', value: new Date(order.updatedAt).toLocaleString() },
  ]

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button
            onClick={() => router.push('/orders')}
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-3"
          >
            <ArrowLeft className="h-4 w-4" /> Back to orders
          </button>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            ORD-{order.id.slice(-4).toUpperCase()}
          </h1>
        </div>
        <span className={`text-xs font-bold tracking-wide uppercase px-3 py-1.5 rounded-full border ${STATUS_COLORS[order.status]}`}>
          {order.status}
        </span>
      </div>

      <div
        className="rounded-2xl border border-white/[0.06] p-5 space-y-4"
        style={{ background: 'rgba(255,255,255,0.025)' }}
      >
        {rows.map(row => (
          <div key={row.label} className="flex justify-between gap-4 py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-slate-500 text-sm">{row.label}</span>
            <span className="text-white text-sm font-medium text-right break-all">{row.value}</span>
          </div>
        ))}
      </div>

      {order.metadata && Object.keys(order.metadata).length > 0 && (
        <div
          className="rounded-2xl border border-white/[0.06] p-5"
          style={{ background: 'rgba(255,255,255,0.025)' }}
        >
          <h2 className="text-white font-semibold text-sm mb-3">Metadata</h2>
          <pre className="text-xs text-slate-400 overflow-x-auto">
            {JSON.stringify(order.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}
