'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import type { Order, OrderStatus } from '@finmark/shared'

interface OrdersResult {
  data:     Order[]
  total:    number
  page:     number
  limit:    number
  hasMore:  boolean
}

interface UseOrdersResult {
  orders:    Order[]
  total:     number
  isLoading: boolean
  error:     string | null
  page:      number
  hasMore:   boolean
  setPage:   (p: number) => void
  setStatus: (s: OrderStatus | 'ALL') => void
  status:    OrderStatus | 'ALL'
  refetch:   () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function useOrders(): UseOrdersResult {
  const { tokens } = useAuth()
  const [orders,    setOrders]    = useState<Order[]>([])
  const [total,     setTotal]     = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)
  const [page,      setPage]      = useState(1)
  const [status,    setStatus]    = useState<OrderStatus | 'ALL'>('ALL')
  const [hasMore,   setHasMore]   = useState(false)

  const load = useCallback(async () => {
    if (!tokens?.accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (status !== 'ALL') params.set('status', status)

      const res = await fetch(`${API_URL}/api/orders?${params}`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()

      setOrders(json.data || [])
      setTotal(json.total || 0)
      setHasMore(json.hasMore || false)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken, page, status])

  useEffect(() => { load() }, [load])

  return { orders, total, isLoading, error, page, hasMore, setPage, setStatus, status, refetch: load }
}
