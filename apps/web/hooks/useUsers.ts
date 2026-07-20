'use client'
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { parseApiResponseError } from '@/lib/api-errors'
import type { UserRole } from '@finmark/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

export interface PlatformUser {
  id:          string
  email:       string
  name:        string
  role:        UserRole
  isActive:    boolean
  lastLoginAt: string | null
  createdAt:   string
  clientId:    string | null
  client?:     { name: string } | null
}

interface UseUsersResult {
  users:     PlatformUser[]
  total:     number
  isLoading: boolean
  error:     string | null
  refetch:   () => void
  updateRole:     (userId: string, role: UserRole) => Promise<boolean>
  setActive:      (userId: string, isActive: boolean) => Promise<boolean>
  assignClient:   (userId: string, clientId: string) => Promise<boolean>
  mutatingId:     string | null
}

export function useUsers(): UseUsersResult {
  const { tokens } = useAuth()
  const [users, setUsers]         = useState<PlatformUser[]>([])
  const [total, setTotal]         = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [mutatingId, setMutatingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!tokens?.accessToken) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      const json = await res.json()
      setUsers(json.data || [])
      setTotal(json.total || 0)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [tokens?.accessToken])

  useEffect(() => { load() }, [load])

  const updateRole = useCallback(async (userId: string, role: UserRole) => {
    if (!tokens?.accessToken) return false
    setMutatingId(userId)
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      await load()
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
      return false
    } finally {
      setMutatingId(null)
    }
  }, [tokens?.accessToken, load])

  const setActive = useCallback(async (userId: string, isActive: boolean) => {
    if (!tokens?.accessToken) return false
    setMutatingId(userId)
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/active`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ isActive }),
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      await load()
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update user status')
      return false
    } finally {
      setMutatingId(null)
    }
  }, [tokens?.accessToken, load])

  const assignClient = useCallback(async (userId: string, clientId: string) => {
    if (!tokens?.accessToken) return false
    setMutatingId(userId)
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/assign-client`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({ clientId }),
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))
      await load()
      return true
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign client')
      return false
    } finally {
      setMutatingId(null)
    }
  }, [tokens?.accessToken, load])

  return {
    users, total, isLoading, error, refetch: load,
    updateRole, setActive, assignClient, mutatingId,
  }
}
