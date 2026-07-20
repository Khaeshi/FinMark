'use client'
import { useState, useEffect } from 'react'
import { sileo } from 'sileo'
import { Modal } from '@/components/ui/Modal'
import {
  FormField, FormLabel, FormInput, FormSelect,
  FormError, FormActions, FormSubmitButton, FormCancelButton,
} from '@/components/ui/Form'
import { useAuth } from '@/lib/auth-context'
import { useClients } from '@/hooks/useClients'
import { USER_ROLES } from '@/lib/role-checks'
import { parseApiResponseError } from '@/lib/api-errors'
import type { UserRole } from '@finmark/shared'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

interface Props {
  isOpen:    boolean
  onClose:   () => void
  onSuccess?: () => void
}

interface FieldErrors {
  name?:     string
  email?:    string
  password?: string
}

function validate(name: string, email: string, password: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim() || name.trim().length < 2) errors.name = 'Name is required'
  if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
    errors.email = 'Enter a valid email address'
  }
  if (!password || password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
  }
  return errors
}

export function InviteUserModal({ isOpen, onClose, onSuccess }: Props) {
  const { tokens } = useAuth()
  const { clients } = useClients()

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole]         = useState<UserRole>('VIEWER')
  const [clientId, setClientId] = useState('')
  const [errors, setErrors]     = useState<FieldErrors>({})
  const [apiError, setApiError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) {
      setName('')
      setEmail('')
      setPassword('')
      setRole('VIEWER')
      setClientId('')
      setErrors({})
      setApiError(null)
    }
  }, [isOpen])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validate(name, email, password)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    if (!tokens?.accessToken) return

    setIsLoading(true)
    setApiError(null)
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      })
      if (!res.ok) throw new Error(await parseApiResponseError(res))

      sileo.success({
        title: 'User invited',
        description: `Ask ${email.trim()} to confirm their email, then assign role (${role}) after first login.`,
      })
      onSuccess?.()
      onClose()
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Invite failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite User">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {apiError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{apiError}</p>
          </div>
        )}

        <p className="text-slate-500 text-xs">
          Creates a Cognito account. Role and client assignment can be applied after the user appears in the directory (first login).
        </p>

        <FormField>
          <FormLabel required>Name</FormLabel>
          <FormInput value={name} onChange={e => setName(e.target.value)} hasError={!!errors.name} />
          <FormError message={errors.name} />
        </FormField>

        <FormField>
          <FormLabel required>Email</FormLabel>
          <FormInput type="email" value={email} onChange={e => setEmail(e.target.value)} hasError={!!errors.email} />
          <FormError message={errors.email} />
        </FormField>

        <FormField>
          <FormLabel required>Temporary password</FormLabel>
          <FormInput type="password" value={password} onChange={e => setPassword(e.target.value)} hasError={!!errors.password} />
          <FormError message={errors.password} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField>
            <FormLabel>Intended role</FormLabel>
            <FormSelect value={role} onChange={e => setRole(e.target.value as UserRole)}>
              {USER_ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </FormSelect>
          </FormField>
          <FormField>
            <FormLabel>Client (optional)</FormLabel>
            <FormSelect value={clientId} onChange={e => setClientId(e.target.value)}>
              <option value="">Unassigned</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </FormSelect>
          </FormField>
        </div>

        <FormActions>
          <FormCancelButton onClick={onClose} />
          <FormSubmitButton isLoading={isLoading}>Send Invite</FormSubmitButton>
        </FormActions>
      </form>
    </Modal>
  )
}
