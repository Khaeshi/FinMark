'use client'
import { useState, useEffect, useCallback } from 'react'
import type { DashboardData } from '@finmark/shared'
import { fetchDashboard } from '../lib/api-client'
import { useAuth } from '../lib/auth-context'
import { MOCK_DASHBOARD } from '../lib/mockData'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

interface UseDashboardResult {
  data:        DashboardData | null
  isLoading:   boolean
  error:       string | null
  isFromCache: boolean
  isMock:      boolean
  refetch:     () => void
}

export function useDashboard(): UseDashboardResult {
  const { tokens } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading,   setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFromCache, setIsFromCache] = useState(false)
  const [isMock, setIsMock] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    // use mock if flag is set
    if (USE_MOCK) {
      setData(MOCK_DASHBOARD)
      setIsMock(true)
      setIsLoading(false)
      return
    }

    // no token yet — use mock as placeholder
    if (!tokens?.accessToken) {
      setData(MOCK_DASHBOARD)
      setIsMock(true)
      setIsLoading(false)
      return
    }

    try {
      const start = Date.now()
      const dashboard = await fetchDashboard(tokens.accessToken)
      const duration = Date.now() - start

      setData(dashboard)
      setIsMock(false)
      setIsFromCache(duration < 100)   // likely Redis cache hit
      setError(null)
    } catch (err: any) {
      console.error('Dashboard fetch failed:', err.message)
      setError(err.message)
      // fallback to mock so UI doesn't break
      setData(MOCK_DASHBOARD)
      setIsMock(true)
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  useEffect(() => {
    load()
    // auto-refresh every 60s — matches Redis TTL
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [load])

  return { data, isLoading, error, isFromCache, isMock, refetch: load }
}
