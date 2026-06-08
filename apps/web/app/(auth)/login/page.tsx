'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginRequest } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import type { UserRole } from '@finmark/shared'

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [error,     setError]     = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await loginRequest(email, password)
      login(
        {
          id:       result.user.id,
          email:    result.user.email,
          name:     result.user.name,
          role:     result.user.role as UserRole,
          clientId: result.user.clientId,
        },
        {
          accessToken:  result.accessToken,
          refreshToken: result.refreshToken,
          idToken:      result.idToken,
        }
      )
      router.push('/')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Fin<span className="text-emerald-400">mark</span>
          </span>
        </div>

        {/* card */}
        <div
          className="rounded-2xl border border-white/5 p-6"
          style={{ background: 'rgba(255,255,255,0.03)' }}
        >
          <h1 className="text-white font-bold text-xl mb-1">Sign in</h1>
          <p className="text-slate-400 text-sm mb-6">Access the Project Finer platform</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@finmark.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 focus:bg-white/8 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wide">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-3 text-sm transition-all duration-200"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>

        {/* dev shortcut — remove in production */}
        {process.env.NODE_ENV === 'development' && (
          <p className="text-center text-slate-600 text-xs mt-4">
            No backend?{' '}
            <button
              onClick={() => router.push('/')}
              className="text-slate-400 hover:text-white underline transition-colors"
            >
              Continue with mock data
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
