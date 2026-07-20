'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { parseApiResponseError } from '@/lib/api-errors'

interface SMEClient {
  id:               string
  name:             string
  industry:         string
  country:          string
  subscriptionTier: string
  isActive:         boolean
  createdAt:        string
  _count?: { users: number; orders: number }
}

interface UseClientsResult {
  clients:   SMEClient[]
  total:     number
  isLoading: boolean
  error:     string | null
  refetch:   () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function useClients(): UseClientsResult {
  const { tokens } = useAuth()
  const [clients,   setClients]   = useState<SMEClient[]>([])
  const [total,     setTotal]     = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tokens?.accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/clients`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      const json = await res.json()
      setClients(json.data || [])
      setTotal(json.total || 0)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  useEffect(() => { load() }, [load])

  return { clients, total, isLoading, error, refetch: load }
}
