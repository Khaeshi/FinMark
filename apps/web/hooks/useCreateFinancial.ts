'use client'
import { useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { parseApiResponseError } from '@/lib/api-errors'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface CreateFinancialInput {
  clientId:   string
  period:     string
  revenue:    string
  expenses:   string
  orderCount: number
}

export interface UpdateFinancialInput {
  revenue?:    string
  expenses?:   string
  orderCount?: number
}

interface UseCreateFinancialResult {
  createFinancial: (input: CreateFinancialInput) => Promise<boolean>
  updateFinancial: (id: string, input: UpdateFinancialInput) => Promise<boolean>
  isLoading:       boolean
  error:           string | null
  success:         boolean
  reset:           () => void
}

export function useCreateFinancial(): UseCreateFinancialResult {
  const { tokens } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [success, setSuccess]     = useState(false)

  const reset = useCallback(() => {
    setError(null)
    setSuccess(false)
  }, [])

  const createFinancial = useCallback(async (input: CreateFinancialInput) => {
    if (!tokens?.accessToken) {
      setError('Not authenticated')
      return false
    }
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`${API_URL}/api/reports/financials`, {
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
      setError(err instanceof Error ? err.message : 'Failed to create financial record')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  const updateFinancial = useCallback(async (id: string, input: UpdateFinancialInput) => {
    if (!tokens?.accessToken) {
      setError('Not authenticated')
      return false
    }
    setIsLoading(true)
    setError(null)
    setSuccess(false)
    try {
      const res = await fetch(`${API_URL}/api/reports/financials/${id}`, {
        method:  'PATCH',
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
      setError(err instanceof Error ? err.message : 'Failed to update financial record')
      return false
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  return { createFinancial, updateFinancial, isLoading, error, success, reset }
}
