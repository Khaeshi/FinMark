'use client'
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react'
import type { UserRole } from '@finmark/shared'

/**
 * Types
 */

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
  user:      AuthUser | null
  tokens:    AuthTokens | null
  isLoading: boolean
  isAuthenticated: boolean
  login:  (user: AuthUser, tokens: AuthTokens) => void
  logout: () => void
}

/**
 * Context
 */

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY_USER   = 'finmark_user'
const STORAGE_KEY_TOKENS = 'finmark_tokens'

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [tokens,    setTokens]    = useState<AuthTokens | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // restore session from localStorage on app load
  useEffect(() => {
    try {
      const storedUser   = localStorage.getItem(STORAGE_KEY_USER)
      const storedTokens = localStorage.getItem(STORAGE_KEY_TOKENS)

      if (storedUser && storedTokens) {
        setUser(JSON.parse(storedUser))
        setTokens(JSON.parse(storedTokens))
      }
    } catch {
      // corrupted storage — clear it
      localStorage.removeItem(STORAGE_KEY_USER)
      localStorage.removeItem(STORAGE_KEY_TOKENS)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback((newUser: AuthUser, newTokens: AuthTokens) => {
    setUser(newUser)
    setTokens(newTokens)
    localStorage.setItem(STORAGE_KEY_USER,   JSON.stringify(newUser))
    localStorage.setItem(STORAGE_KEY_TOKENS, JSON.stringify(newTokens))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setTokens(null)
    localStorage.removeItem(STORAGE_KEY_USER)
    localStorage.removeItem(STORAGE_KEY_TOKENS)
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
    }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook
 * @returns ctx 
 */

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
