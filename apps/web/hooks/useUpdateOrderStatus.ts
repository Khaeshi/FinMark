'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { parseApiResponseError } from '@/lib/api-errors'
import type { OrderStatus } from '@finmark/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface UseUpdateOrderStatusResult {
  updateStatus: (orderId: string, status: OrderStatus) => Promise<boolean>
  cancelOrder:  (orderId: string, reason?: string) => Promise<boolean>
  isLoading:    boolean
  error:        string | null
  updatingId:   string | null
}

export function useUpdateOrderStatus(): UseUpdateOrderStatusResult {
  const { tokens } = useAuth()
  const [isLoading, setIsLoading]   = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const updateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    if (!tokens?.accessToken) {
      setError('Not authenticated')
      return false
    }
    setIsLoading(true)
    setUpdatingId(orderId)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
      return false
    } finally {
      setIsLoading(false)
      setUpdatingId(null)
    }
  }, [tokens?.accessToken])

  const cancelOrder = useCallback(async (orderId: string, reason?: string) => {
    if (!tokens?.accessToken) {
      setError('Not authenticated')
      return false
    }
    setIsLoading(true)
    setUpdatingId(orderId)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}`, {
        method:  'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ reason }),
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to cancel order')
      return false
    } finally {
      setIsLoading(false)
      setUpdatingId(null)
    }
  }, [tokens?.accessToken])

  return { updateStatus, cancelOrder, isLoading, error, updatingId }
}
