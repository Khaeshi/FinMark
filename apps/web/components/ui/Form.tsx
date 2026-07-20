'use client'
import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from 'react'

export function FormField({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}>{children}</div>
}

export function FormLabel({
  children,
  required,
  htmlFor,
}: {
  children: ReactNode
  required?: boolean
  htmlFor?: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs text-slate-400 font-medium uppercase tracking-wide"
    >
      {children}
      {required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  )
}

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export function FormInput({ hasError, className = '', ...props }: FormInputProps) {
  return (
    <input
      {...props}
      className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all disabled:opacity-50 ${
        hasError
          ? 'border-red-500/50 bg-red-500/5'
          : 'border-white/10 focus:border-emerald-500/50'
      } ${className}`}
    />
  )
}

interface FormSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean
}

export function FormSelect({ hasError, className = '', children, ...props }: FormSelectProps) {
  return (
    <select
      {...props}
      className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none transition-all disabled:opacity-50 ${
        hasError
          ? 'border-red-500/50 bg-red-500/5'
          : 'border-white/10 focus:border-emerald-500/50'
      } ${className}`}
    >
      {children}
    </select>
  )
}

export function FormTextarea({
  hasError,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { hasError?: boolean }) {
  return (
    <textarea
      {...props}
      className={`w-full bg-white/5 border rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-slate-600 focus:outline-none transition-all resize-none disabled:opacity-50 ${
        hasError
          ? 'border-red-500/50 bg-red-500/5'
          : 'border-white/10 focus:border-emerald-500/50'
      } ${className}`}
    />
  )
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="text-red-400 text-xs flex items-center gap-1">
      <span>✕</span> {message}
    </p>
  )
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-end gap-2 pt-2">{children}</div>
}

export function FormSubmitButton({
  children,
  isLoading,
  disabled,
}: {
  children: ReactNode
  isLoading?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="submit"
      disabled={disabled || isLoading}
      className="px-4 py-2.5 rounded-xl bg-emerald-500 text-[#0d1117] text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-[#0d1117]/30 border-t-[#0d1117] rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

export function FormCancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-300 text-sm font-medium hover:bg-white/[0.07] transition-colors"
    >
      Cancel
    </button>
  )
}
