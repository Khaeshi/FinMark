'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginRequest } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import type { UserRole } from '@finmark/shared'

interface FieldErrors {
  email?:    string
  password?: string
  general?:  string
}

function validateForm(email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!email || email.trim() === '') {
    errors.email = 'Email is required'
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.email = 'Please enter a valid email address'
  }
  if (!password || password === '') {
    errors.password = 'Password is required'
  } else if (password.length < 6) {
    errors.password = 'Password must be at least 6 characters'
  }
  return errors
}

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [errors,    setErrors]    = useState<FieldErrors>({})
  const [touched,   setTouched]   = useState({ email: false, password: false })
  const [isLoading, setIsLoading] = useState(false)

  function handleBlur(field: 'email' | 'password') {
    setTouched(prev => ({ ...prev, [field]: true }))
    const fieldErrors = validateForm(email, password)
    setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    if (touched.email) {
      const fieldErrors = validateForm(value, password)
      setErrors(prev => ({ ...prev, email: fieldErrors.email }))
    }
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    if (touched.password) {
      const fieldErrors = validateForm(email, value)
      setErrors(prev => ({ ...prev, password: fieldErrors.password }))
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})
    setTouched({ email: true, password: true })
    const fieldErrors = validateForm(email, password)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setIsLoading(true)
    try {
      const result = await loginRequest(email.trim(), password)
      if (!result?.accessToken || !result?.user) throw new Error('Invalid response from server')
      login(
        { id: result.user.id, email: result.user.email, name: result.user.name, role: result.user.role as UserRole, clientId: result.user.clientId },
        { accessToken: result.accessToken, refreshToken: result.refreshToken, idToken: result.idToken }
      )
      router.push('/')
    } catch (err: any) {
      const message = err.message || 'Login failed'
      if (message.includes('Invalid credentials') || message.includes('Incorrect')) {
        setErrors({ general: 'Incorrect email or password. Please try again.' })
      } else if (message.includes('fetch') || message.includes('network') || message.includes('Failed')) {
        setErrors({ general: 'Cannot connect to server. Please check your connection.' })
      } else if (message.includes('rate') || message.includes('too many')) {
        setErrors({ general: 'Too many login attempts. Please wait a few minutes.' })
      } else {
        setErrors({ general: 'Something went wrong. Please try again.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const hasEmailError    = touched.email    && errors.email
  const hasPasswordError = touched.password && errors.password

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">Fin<span className="text-emerald-400">mark</span></span>
        </div>
        <div className="rounded-2xl border border-white/5 p-6" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <h1 className="text-white font-bold text-xl mb-1">Sign in</h1>
          <p className="text-slate-400 text-sm mb-6">Access the Project Finer platform</p>
          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4 flex items-start gap-2">
              <span className="text-red-400 mt-0.5 flex-shrink-0">⚠</span>
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wide">Email <span className="text-red-400">*</span></label>
              <input
                type="email" value={email}
                onChange={e => handleEmailChange(e.target.value)}
                onBlur={() => handleBlur('email')}
                placeholder="admin@finmark.com"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all ${hasEmailError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-emerald-500/50'}`}
              />
              {hasEmailError && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>✕</span> {errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wide">Password <span className="text-red-400">*</span></label>
              <input
                type="password" value={password}
                onChange={e => handlePasswordChange(e.target.value)}
                onBlur={() => handleBlur('password')}
                placeholder="••••••••"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all ${hasPasswordError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-emerald-500/50'}`}
              />
              {hasPasswordError && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>✕</span> {errors.password}</p>}
            </div>
            <button type="submit" disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-3 text-sm transition-all duration-200">
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>
        {process.env.NODE_ENV !== 'production' && (
          <div className="mt-4 rounded-xl border border-white/5 p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <p className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wide">Dev shortcuts</p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => { setEmail('admin@finmark.com'); setPassword('devpassword'); setErrors({}) }}
                className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg">Fill Admin</button>
              <button onClick={() => { setEmail(''); setPassword(''); setErrors({}); setTouched({ email: false, password: false }) }}
                className="text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">Clear</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
