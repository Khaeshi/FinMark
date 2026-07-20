'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { parseApiResponseError } from '@/lib/api-errors'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface CreateClientInput {
  name:              string
  industry:          string
  country?:          string
  subscriptionTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'
}

interface UseCreateClientResult {
  createClient: (input: CreateClientInput) => Promise<boolean>
  isLoading:    boolean
  error:        string | null
  success:      boolean
  reset:        () => void
}

export function useCreateClient(): UseCreateClientResult {
  const { tokens } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  const reset = useCallback(() => {
    setError(null)
    setSuccess(false)
  }, [])

  const createClient = useCallback(async (input: CreateClientInput) => {
    if (!tokens?.accessToken) {
      setError('Not authenticated')
      return false
    }
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`${API_URL}/api/admin/clients`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(input),
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      setSuccess(true)
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create client')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  return { createClient, isLoading, error, success, reset }
}
