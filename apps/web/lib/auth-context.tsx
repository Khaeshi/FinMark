'use client'
import {
  createContext, useContext,
  useState, useEffect, useCallback,
} from 'react'
import type { UserRole } from '@finmark/shared'
import { fetchUserProfile } from './api-client'
import { applyAccentColor } from './user-preferences'

export interface AuthUser {
  id:        string
  email:     string
  name:      string
  role:      UserRole
  clientId?: string
}

export interface AuthTokens {
  accessToken:  string
  refreshToken: string
  idToken:      string
}

interface AuthContextValue {
  user:            AuthUser | null
  tokens:          AuthTokens | null
  isLoading:       boolean
  isAuthenticated: boolean
  login:           (user: AuthUser, tokens: AuthTokens) => void
  logout:          () => void
  refreshProfile:  () => Promise<void>
  updateUser:      (patch: Partial<AuthUser>) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const KEY_USER   = 'finmark_user'
const KEY_TOKENS = 'finmark_tokens'

function setCookie(name: string, value: string, hours = 8) {
  const expires = new Date(Date.now() + hours * 3600000).toUTCString()
  document.cookie = `${name}=${value};expires=${expires};path=/;SameSite=Lax`
}

function deleteCookie(name: string) {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
}

function persistUser(user: AuthUser) {
  localStorage.setItem(KEY_USER, JSON.stringify(user))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [tokens,    setTokens]    = useState<AuthTokens | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    applyAccentColor()
    try {
      const storedUser   = localStorage.getItem(KEY_USER)
      const storedTokens = localStorage.getItem(KEY_TOKENS)
      if (storedUser && storedTokens) {
        setUser(JSON.parse(storedUser))
        setTokens(JSON.parse(storedTokens))
      }
    } catch {
      localStorage.removeItem(KEY_USER)
      localStorage.removeItem(KEY_TOKENS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev
      const next = { ...prev, ...patch }
      persistUser(next)
      return next
    })
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!tokens?.accessToken) return
    try {
      const profile = await fetchUserProfile(tokens.accessToken)
      const next: AuthUser = {
        id:       profile.id,
        email:    profile.email,
        name:     profile.name,
        role:     profile.role as UserRole,
        clientId: profile.clientId,
      }
      setUser(next)
      persistUser(next)
    } catch {
      // keep cached user if profile fetch fails
    }
  }, [tokens?.accessToken])

  useEffect(() => {
    if (tokens?.accessToken) refreshProfile()
  }, [tokens?.accessToken, refreshProfile])

  const login = useCallback((newUser: AuthUser, newTokens: AuthTokens) => {
    setUser(newUser)
    setTokens(newTokens)
    persistUser(newUser)
    localStorage.setItem(KEY_TOKENS, JSON.stringify(newTokens))
    setCookie('finmark_token', newTokens.accessToken)
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setTokens(null)
    localStorage.removeItem(KEY_USER)
    localStorage.removeItem(KEY_TOKENS)
    deleteCookie('finmark_token')
    window.location.href = '/login'
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      tokens,
      isLoading,
      isAuthenticated: !!user && !!tokens,
      login,
      logout,
      refreshProfile,
      updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
