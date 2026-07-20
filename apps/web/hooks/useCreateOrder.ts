'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { parseApiResponseError } from '@/lib/api-errors'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface CreateOrderInput {
  clientId:     string
  amount:       string
  currency?:    string
  description?: string
  metadata?:    Record<string, unknown>
}

export interface CreateOrderResult {
  ok:         boolean
  flagged?:   boolean
  flagReason?: string | null
}

interface UseCreateOrderResult {
  createOrder: (input: CreateOrderInput) => Promise<CreateOrderResult>
  isLoading:   boolean
  error:       string | null
  success:     boolean
  reset:       () => void
}

export function useCreateOrder(): UseCreateOrderResult {
  const { tokens } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  const reset = useCallback(() => {
    setError(null)
    setSuccess(false)
  }, [])

  const createOrder = useCallback(async (input: CreateOrderInput): Promise<CreateOrderResult> => {
    if (!tokens?.accessToken) {
      setError('Not authenticated')
      return { ok: false }
    }
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          Authorization:   `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      const json = await res.json()
      setSuccess(true)
      return {
        ok: true,
        flagged: Boolean(json.data?.flagged),
        flagReason: json.data?.flagReason ?? null,
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create order')
      return { ok: false }
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  return { createOrder, isLoading, error, success, reset }
}
