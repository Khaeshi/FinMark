'use client'
import { useState, useEffect } from 'react'
import { sileo } from 'sileo'
import { isValidAmount } from '@finmark/shared'
import { Modal } from '@/components/ui/Modal'
import {
  FormField, FormLabel, FormInput, FormSelect, FormTextarea,
  FormError, FormActions, FormSubmitButton, FormCancelButton,
} from '@/components/ui/Form'
import { useCreateOrder } from '@/hooks/useCreateOrder'
import { useClients } from '@/hooks/useClients'
import { useAuth } from '@/lib/auth-context'
import { canManageClients } from '@/lib/role-checks'

interface Props {
  isOpen:   boolean
  onClose:  () => void
  onSuccess?: () => void
}

interface FieldErrors {
  clientId?:    string
  amount?:      string
  description?: string
  general?:     string
}

function validate(clientId: string, amount: string, description: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!clientId) errors.clientId = 'Please select a client'
  if (!amount.trim()) {
    errors.amount = 'Amount is required'
  } else if (!isValidAmount(amount.trim()) || parseFloat(amount) <= 0) {
    errors.amount = 'Enter a positive amount with up to 2 decimal places'
  }
  if (description.length > 255) {
    errors.description = 'Description must be 255 characters or less'
  }
  return errors
}

export function CreateOrderModal({ isOpen, onClose, onSuccess }: Props) {
  const { user } = useAuth()
  const { createOrder, isLoading, error, reset } = useCreateOrder()
  const canPickClient = canManageClients(user?.role)
  const { clients } = useClients()

  const lockedClientId = !canPickClient ? (user?.clientId || '') : ''

  const [clientId, setClientId]         = useState('')
  const [amount, setAmount]             = useState('')
  const [currency, setCurrency]         = useState('PHP')
  const [description, setDescription]   = useState('')
  const [errors, setErrors]             = useState<FieldErrors>({})
  const [touched, setTouched]           = useState<Record<string, boolean>>({})
  const [flagNotice, setFlagNotice]     = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setClientId('')
      setAmount('')
      setCurrency('PHP')
      setDescription('')
      setErrors({})
      setTouched({})
      setFlagNotice(null)
      reset()
      return
    }
    if (lockedClientId) setClientId(lockedClientId)
  }, [isOpen, reset, lockedClientId])

  function handleBlur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }))
    setErrors(validate(clientId || lockedClientId, amount, description))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const resolvedClientId = clientId || lockedClientId
    setTouched({ clientId: true, amount: true, description: true })
    const fieldErrors = validate(resolvedClientId, amount, description)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    const result = await createOrder({
      clientId: resolvedClientId,
      amount: amount.trim(),
      currency,
      description: description.trim() || undefined,
    })

    if (!result.ok) return

    if (result.flagged) {
      setFlagNotice(
        result.flagReason
          || 'This order is significantly larger than usual for this client — flagged for review.'
      )
      sileo.success({ title: 'Order created', description: 'Flagged for review' })
      onSuccess?.()
      // Keep modal open briefly so the demo notice is visible
      setTimeout(() => onClose(), 2200)
      return
    }

    sileo.success({ title: 'Order created' })
    onSuccess?.()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Order">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {flagNotice && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-amber-300 text-sm font-medium">⚠ Unusual amount</p>
            <p className="text-amber-400/80 text-xs mt-1">{flagNotice}</p>
          </div>
        )}

        <FormField>
          <FormLabel required>Client</FormLabel>
          {canPickClient ? (
            <FormSelect
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              onBlur={() => handleBlur('clientId')}
              hasError={touched.clientId && !!errors.clientId}
              disabled={!!flagNotice}
            >
              <option value="">Select SME client…</option>
              {clients.filter(c => c.isActive).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </FormSelect>
          ) : (
            <FormInput
              value={lockedClientId ? `Assigned client (${lockedClientId.slice(0, 8)}…)` : 'No client assigned to your account'}
              disabled
              hasError={touched.clientId && !!errors.clientId}
            />
          )}
          <FormError message={touched.clientId ? errors.clientId : undefined} />
        </FormField>

        <FormField>
          <FormLabel required>Amount (PHP)</FormLabel>
          <FormInput
            type="text"
            inputMode="decimal"
            placeholder="e.g. 15000.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            onBlur={() => handleBlur('amount')}
            hasError={touched.amount && !!errors.amount}
            disabled={!!flagNotice}
          />
          <FormError message={touched.amount ? errors.amount : undefined} />
        </FormField>

        <FormField>
          <FormLabel>Currency</FormLabel>
          <FormSelect value={currency} onChange={e => setCurrency(e.target.value)} disabled={!!flagNotice}>
            <option value="PHP">PHP — Philippine Peso</option>
            <option value="USD">USD — US Dollar</option>
            <option value="SGD">SGD — Singapore Dollar</option>
          </FormSelect>
        </FormField>

        <FormField>
          <FormLabel>Description</FormLabel>
          <FormTextarea
            rows={3}
            maxLength={255}
            placeholder="Optional order notes…"
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={() => handleBlur('description')}
            hasError={touched.description && !!errors.description}
            disabled={!!flagNotice}
          />
          <FormError message={touched.description ? errors.description : undefined} />
        </FormField>

        {!flagNotice && (
          <FormActions>
            <FormCancelButton onClick={onClose} />
            <FormSubmitButton isLoading={isLoading}>Create Order</FormSubmitButton>
          </FormActions>
        )}
      </form>
    </Modal>
  )
}
