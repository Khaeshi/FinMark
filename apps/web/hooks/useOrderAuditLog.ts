'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { parseApiResponseError } from '@/lib/api-errors'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface OrderAuditEntry {
  id:        string
  action:    string
  userId:    string
  userName:  string
  userEmail: string | null
  metadata:  Record<string, unknown> | null
  createdAt: string
}

interface UseOrderAuditLogResult {
  entries:   OrderAuditEntry[]
  isLoading: boolean
  error:     string | null
  refetch:   () => void
}

export function useOrderAuditLog(orderId: string | undefined): UseOrderAuditLogResult {
  const { tokens } = useAuth()
  const [entries, setEntries]     = useState<OrderAuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tokens?.accessToken || !orderId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/orders/${orderId}/audit-log`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      const json = await res.json()
      setEntries(json.data || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load audit log')
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken, orderId])

  useEffect(() => { load() }, [load])

  return { entries, isLoading, error, refetch: load }
}
