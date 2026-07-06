'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { loginRequest } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { Eye, EyeOff } from 'lucide-react'
import type { UserRole } from '@finmark/shared'

/* ------------------------------------------------------------------ */
/*  Eye-tracking cartoon characters — kept from the reference design, */
/*  recolored to Finmark's dark/emerald palette instead of a generic  */
/*  purple/orange/yellow scheme.                                      */
/* ------------------------------------------------------------------ */

interface PupilProps {
  size?: number
  maxDistance?: number
  pupilColor?: string
  forceLookX?: number
  forceLookY?: number
}

function Pupil({ size = 12, maxDistance = 5, pupilColor = '#0B0F1A', forceLookX, forceLookY }: PupilProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const getPos = () => {
    if (!ref.current) return { x: 0, y: 0 }
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = mouse.x - cx
    const dy = mouse.y - cy
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  }

  const pos = getPos()

  return (
    <div
      ref={ref}
      className="rounded-full"
      style={{
        width: size, height: size, backgroundColor: pupilColor,
        transform: `translate(${pos.x}px, ${pos.y}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    />
  )
}

interface EyeBallProps {
  size?: number
  pupilSize?: number
  maxDistance?: number
  eyeColor?: string
  pupilColor?: string
  isBlinking?: boolean
  forceLookX?: number
  forceLookY?: number
}

function EyeBall({
  size = 48, pupilSize = 16, maxDistance = 10,
  eyeColor = 'white', pupilColor = '#0B0F1A', isBlinking = false,
  forceLookX, forceLookY,
}: EyeBallProps) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  const getPos = () => {
    if (!ref.current) return { x: 0, y: 0 }
    if (forceLookX !== undefined && forceLookY !== undefined) return { x: forceLookX, y: forceLookY }
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    const dx = mouse.x - cx
    const dy = mouse.y - cy
    const dist = Math.min(Math.sqrt(dx ** 2 + dy ** 2), maxDistance)
    const angle = Math.atan2(dy, dx)
    return { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist }
  }

  const pos = getPos()

  return (
    <div
      ref={ref}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{ width: size, height: isBlinking ? 2 : size, backgroundColor: eyeColor, overflow: 'hidden' }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: pupilSize, height: pupilSize, backgroundColor: pupilColor,
            transform: `translate(${pos.x}px, ${pos.y}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
    </div>
  )
}

function useBlink() {
  const [isBlinking, setIsBlinking] = useState(false)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>
    const schedule = () => {
      timeout = setTimeout(() => {
        setIsBlinking(true)
        setTimeout(() => { setIsBlinking(false); schedule() }, 150)
      }, Math.random() * 4000 + 3000)
    }
    schedule()
    return () => clearTimeout(timeout)
  }, [])
  return isBlinking
}

function CastOfCharacters({
  isTyping, isPasswordVisible, hasPassword,
}: { isTyping: boolean; isPasswordVisible: boolean; hasPassword: boolean }) {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false)
  const [isPeeking, setIsPeeking] = useState(false)
  const emeraldBlink = useBlink()
  const slateBlink = useBlink()
  const emeraldRef = useRef<HTMLDivElement>(null)
  const slateRef = useRef<HTMLDivElement>(null)
  const amberRef = useRef<HTMLDivElement>(null)
  const blueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMove = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handleMove)
    return () => window.removeEventListener('mousemove', handleMove)
  }, [])

  useEffect(() => {
    if (!isTyping) { setIsLookingAtEachOther(false); return }
    setIsLookingAtEachOther(true)
    const t = setTimeout(() => setIsLookingAtEachOther(false), 800)
    return () => clearTimeout(t)
  }, [isTyping])

  useEffect(() => {
    if (!(hasPassword && isPasswordVisible)) { setIsPeeking(false); return }
    const t = setTimeout(() => {
      setIsPeeking(true)
      setTimeout(() => setIsPeeking(false), 800)
    }, Math.random() * 3000 + 2000)
    return () => clearTimeout(t)
  }, [hasPassword, isPasswordVisible, isPeeking])

  const posFor = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 }
    const rect = ref.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 3
    const dx = mouse.x - cx
    const dy = mouse.y - cy
    return {
      faceX: Math.max(-15, Math.min(15, dx / 20)),
      faceY: Math.max(-10, Math.min(10, dy / 30)),
      bodySkew: Math.max(-6, Math.min(6, -dx / 120)),
    }
  }

  const emeraldPos = posFor(emeraldRef)
  const slatePos = posFor(slateRef)
  const amberPos = posFor(amberRef)
  const bluePos = posFor(blueRef)
  const revealing = hasPassword && isPasswordVisible

  return (
    <div className="relative" style={{ width: 550, height: 400 }}>
      {/* Emerald tall character — back layer */}
      <div
        ref={emeraldRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 70, width: 180,
          height: (isTyping || (hasPassword && !isPasswordVisible)) ? 440 : 400,
          backgroundColor: '#10B981', borderRadius: '10px 10px 0 0', zIndex: 1,
          transform: revealing
            ? 'skewX(0deg)'
            : (isTyping || (hasPassword && !isPasswordVisible))
              ? `skewX(${emeraldPos.bodySkew - 12}deg) translateX(40px)`
              : `skewX(${emeraldPos.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-700 ease-in-out"
          style={{
            left: revealing ? 20 : isLookingAtEachOther ? 55 : 45 + emeraldPos.faceX,
            top: revealing ? 35 : isLookingAtEachOther ? 65 : 40 + emeraldPos.faceY,
          }}
        >
          <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={emeraldBlink}
            forceLookX={revealing ? (isPeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={revealing ? (isPeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
          <EyeBall size={18} pupilSize={7} maxDistance={5} isBlinking={emeraldBlink}
            forceLookX={revealing ? (isPeeking ? 4 : -4) : isLookingAtEachOther ? 3 : undefined}
            forceLookY={revealing ? (isPeeking ? 5 : -4) : isLookingAtEachOther ? 4 : undefined} />
        </div>
      </div>

      {/* Slate tall character — middle layer */}
      <div
        ref={slateRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 240, width: 120, height: 310,
          backgroundColor: '#1E293B', borderRadius: '8px 8px 0 0', zIndex: 2,
          transform: revealing
            ? 'skewX(0deg)'
            : isLookingAtEachOther
              ? `skewX(${slatePos.bodySkew * 1.5 + 10}deg) translateX(20px)`
              : (isTyping || (hasPassword && !isPasswordVisible))
                ? `skewX(${slatePos.bodySkew * 1.5}deg)`
                : `skewX(${slatePos.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-700 ease-in-out"
          style={{
            left: revealing ? 10 : isLookingAtEachOther ? 32 : 26 + slatePos.faceX,
            top: revealing ? 28 : isLookingAtEachOther ? 12 : 32 + slatePos.faceY,
          }}
        >
          <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={slateBlink}
            forceLookX={revealing ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={revealing ? -4 : isLookingAtEachOther ? -4 : undefined} />
          <EyeBall size={16} pupilSize={6} maxDistance={4} isBlinking={slateBlink}
            forceLookX={revealing ? -4 : isLookingAtEachOther ? 0 : undefined}
            forceLookY={revealing ? -4 : isLookingAtEachOther ? -4 : undefined} />
        </div>
      </div>

      {/* Amber semi-circle character — front left */}
      <div
        ref={amberRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 0, width: 240, height: 200, zIndex: 3,
          backgroundColor: '#F59E0B', borderRadius: '120px 120px 0 0',
          transform: revealing ? 'skewX(0deg)' : `skewX(${amberPos.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-8 transition-all duration-200 ease-out"
          style={{ left: revealing ? 50 : 82 + amberPos.faceX, top: revealing ? 85 : 90 + amberPos.faceY }}
        >
          <Pupil size={12} maxDistance={5} forceLookX={revealing ? -5 : undefined} forceLookY={revealing ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} forceLookX={revealing ? -5 : undefined} forceLookY={revealing ? -4 : undefined} />
        </div>
      </div>

      {/* Blue tall character — front right */}
      <div
        ref={blueRef}
        className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{
          left: 310, width: 140, height: 230, zIndex: 4,
          backgroundColor: '#3B82F6', borderRadius: '70px 70px 0 0',
          transform: revealing ? 'skewX(0deg)' : `skewX(${bluePos.bodySkew}deg)`,
          transformOrigin: 'bottom center',
        }}
      >
        <div
          className="absolute flex gap-6 transition-all duration-200 ease-out"
          style={{ left: revealing ? 20 : 52 + bluePos.faceX, top: revealing ? 35 : 40 + bluePos.faceY }}
        >
          <Pupil size={12} maxDistance={5} forceLookX={revealing ? -5 : undefined} forceLookY={revealing ? -4 : undefined} />
          <Pupil size={12} maxDistance={5} forceLookX={revealing ? -5 : undefined} forceLookY={revealing ? -4 : undefined} />
        </div>
        <div
          className="absolute w-20 h-1 bg-[#0B0F1A] rounded-full transition-all duration-200 ease-out"
          style={{ left: revealing ? 10 : 40 + bluePos.faceX, top: revealing ? 88 : 88 + bluePos.faceY }}
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Real login form logic — unchanged from the previous page, just    */
/*  restyled to sit in the right-hand panel of the split layout.      */
/* ------------------------------------------------------------------ */

interface FieldErrors { email?: string; password?: string; general?: string }

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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState({ email: false, password: false })
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)

  function handleBlur(field: 'email' | 'password') {
    setTouched(prev => ({ ...prev, [field]: true }))
    const fieldErrors = validateForm(email, password)
    setErrors(prev => ({ ...prev, [field]: fieldErrors[field] }))
  }

  function handleEmailChange(value: string) {
    setEmail(value)
    if (touched.email) setErrors(prev => ({ ...prev, email: validateForm(value, password).email }))
  }

  function handlePasswordChange(value: string) {
    setPassword(value)
    if (touched.password) setErrors(prev => ({ ...prev, password: validateForm(email, value).password }))
  }

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setTouched({ email: true, password: true })
    const fieldErrors = validateForm(email, password)
    if (Object.keys(fieldErrors).length > 0) { setErrors(fieldErrors); return }
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
  }, [email, password, login, router])

  const hasEmailError = touched.email && errors.email
  const hasPasswordError = touched.password && errors.password

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-[#0B0F1A]">
      {/* Left panel — cast of characters */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 size-64 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-blue-500/5 rounded-full blur-3xl" />

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
            <span className="text-white font-black text-sm">F</span>
          </div>
          <span className="text-white font-bold text-lg tracking-tight">
            Fin<span className="text-emerald-400">mark</span>
          </span>
        </div>

        <div className="relative z-10 flex items-end justify-center h-[500px]">
          <CastOfCharacters isTyping={isTyping} isPasswordVisible={showPassword} hasPassword={password.length > 0} />
        </div>

        <p className="relative z-10 text-slate-500 text-sm">
          Data-driven financial services platform for SMEs across Southeast Asia
        </p>
      </div>

      {/* Right panel — real login form */}
      <div className="flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-10">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
              <span className="text-white font-black text-sm">F</span>
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Fin<span className="text-emerald-400">mark</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="text-white font-bold text-2xl mb-1">Welcome back!</h1>
            <p className="text-slate-400 text-sm">Access the Project Finer platform</p>
          </div>

          {errors.general && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-5 flex items-start gap-2">
              <span className="text-red-400 mt-0.5 flex-shrink-0">⚠</span>
              <p className="text-red-400 text-sm">{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wide">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                value={email}
                autoComplete="off"
                onChange={e => handleEmailChange(e.target.value)}
                onFocus={() => setIsTyping(true)}
                onBlur={() => { setIsTyping(false); handleBlur('email') }}
                placeholder="admin@finmark.com"
                className={`w-full bg-white/5 border rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all ${hasEmailError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-emerald-500/50'}`}
              />
              {hasEmailError && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>✕</span> {errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1.5 uppercase tracking-wide">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  onBlur={() => handleBlur('password')}
                  placeholder="••••••••"
                  className={`w-full bg-white/5 border rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all ${hasPasswordError ? 'border-red-500/50 bg-red-500/5' : 'border-white/10 focus:border-emerald-500/50'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {hasPasswordError && <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1"><span>✕</span> {errors.password}</p>}
            </div>

            <div className="flex items-center justify-end">
              <a href="/forgot-password" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl px-4 py-3 text-sm transition-all duration-200"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </form>

          {process.env.NODE_ENV !== 'production' && (
            <div className="mt-6 rounded-xl border border-white/5 p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-slate-500 text-xs mb-2 font-medium uppercase tracking-wide">Dev shortcuts</p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => { setEmail('admin@finmark.com'); setPassword('devpassword'); setErrors({}) }}
                  className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg"
                >
                  Fill Admin
                </button>
                <button
                  onClick={() => { setEmail(''); setPassword(''); setErrors({}); setTouched({ email: false, password: false }) }}
                  className="text-xs text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
