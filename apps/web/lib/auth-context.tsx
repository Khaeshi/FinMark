'use client'
import {
  createContext, useContext,
  useState, useEffect, useCallback,
} from 'react'
import type { UserRole } from '@finmark/shared'

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [tokens,    setTokens]    = useState<AuthTokens | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
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

  const login = useCallback((newUser: AuthUser, newTokens: AuthTokens) => {
    setUser(newUser)
    setTokens(newTokens)
    localStorage.setItem(KEY_USER,   JSON.stringify(newUser))
    localStorage.setItem(KEY_TOKENS, JSON.stringify(newTokens))
    // also set cookie so Next.js middleware can read it
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
