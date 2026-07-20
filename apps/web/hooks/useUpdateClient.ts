'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { parseApiResponseError } from '@/lib/api-errors'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface UpdateClientInput {
  name?:             string
  industry?:         string
  isActive?:         boolean
  subscriptionTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'
}

interface UseUpdateClientResult {
  updateClient: (id: string, input: UpdateClientInput) => Promise<boolean>
  isLoading:    boolean
  error:        string | null
}

export function useUpdateClient(): UseUpdateClientResult {
  const { tokens } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const updateClient = useCallback(async (id: string, input: UpdateClientInput) => {
    if (!tokens?.accessToken) {
      setError('Not authenticated')
      return false
    }
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/clients/${id}`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update client')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  return { updateClient, isLoading, error }
}
