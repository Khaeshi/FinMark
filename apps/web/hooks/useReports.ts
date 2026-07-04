'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'

interface FinancialRecord {
  id:         string
  clientId:   string
  period:     string
  revenue:    string
  expenses:   string
  netProfit:  string
  orderCount: number
  client?:    { name: string; industry: string }
}

interface UseReportsResult {
  financials: FinancialRecord[]
  isLoading:  boolean
  error:      string | null
  refetch:    () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export function useReports(): UseReportsResult {
  const { tokens } = useAuth()
  const [financials, setFinancials] = useState<FinancialRecord[]>([])
  const [isLoading,  setIsLoading]  = useState(true)
  const [error,      setError]      = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tokens?.accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/reports/financials`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setFinancials(json.data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  useEffect(() => { load() }, [load])

  return { financials, isLoading, error, refetch: load }
}
