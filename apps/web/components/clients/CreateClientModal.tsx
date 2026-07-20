'use client'
import { useState, useEffect } from 'react'
import { sileo } from 'sileo'
import { Modal } from '@/components/ui/Modal'
import {
  FormField, FormLabel, FormInput, FormSelect,
  FormError, FormActions, FormSubmitButton, FormCancelButton,
} from '@/components/ui/Form'
import { useCreateClient } from '@/hooks/useCreateClient'
import { useUpdateClient } from '@/hooks/useUpdateClient'
import { INDUSTRIES, SUBSCRIPTION_TIERS } from '@/lib/role-checks'

interface ClientData {
  id?:               string
  name:              string
  industry:          string
  country:           string
  subscriptionTier:  string
  isActive?:         boolean
}

interface Props {
  isOpen:   boolean
  onClose:  () => void
  onSuccess?: () => void
  client?:  ClientData | null
}

interface FieldErrors {
  name?:     string
  industry?: string
  country?:  string
  tier?:     string
}

function validate(name: string, industry: string, country: string, tier: string): FieldErrors {
  const errors: FieldErrors = {}
  if (!name.trim() || name.trim().length < 2) errors.name = 'Name must be at least 2 characters'
  if (!industry) errors.industry = 'Please select an industry'
  if (!country || country.length !== 2) errors.country = 'Country must be a 2-letter code'
  if (!SUBSCRIPTION_TIERS.includes(tier as typeof SUBSCRIPTION_TIERS[number])) {
    errors.tier = 'Select a valid subscription tier'
  }
  return errors
}

export function CreateClientModal({ isOpen, onClose, onSuccess, client }: Props) {
  const isEdit = !!client?.id
  const { createClient, isLoading: creating, error: createError, reset } = useCreateClient()
  const { updateClient, isLoading: updating, error: updateError } = useUpdateClient()

  const [name, setName]         = useState('')
  const [industry, setIndustry] = useState('')
  const [country, setCountry]   = useState('PH')
  const [tier, setTier]         = useState('FREE')
  const [errors, setErrors]     = useState<FieldErrors>({})
  const [touched, setTouched]   = useState<Record<string, boolean>>({})

  const isLoading = creating || updating
  const apiError  = createError || updateError

  useEffect(() => {
    if (!isOpen) {
      reset()
      setErrors({})
      setTouched({})
      return
    }
    if (client) {
      setName(client.name)
      setIndustry(client.industry)
      setCountry(client.country || 'PH')
      setTier(client.subscriptionTier || 'FREE')
    } else {
      setName('')
      setIndustry('')
      setCountry('PH')
      setTier('FREE')
    }
  }, [isOpen, client, reset])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ name: true, industry: true, country: true, tier: true })
    const fieldErrors = validate(name, industry, country, tier)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    let ok = false
    if (isEdit && client?.id) {
      ok = await updateClient(client.id, {
        name: name.trim(),
        industry,
        subscriptionTier: tier as 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
      })
    } else {
      ok = await createClient({
        name: name.trim(),
        industry,
        country: country.toUpperCase(),
        subscriptionTier: tier as 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE',
      })
    }

    if (ok) {
      sileo.success({ title: isEdit ? 'Client updated' : 'Client created' })
      onSuccess?.()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Client' : 'Add Client'}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {apiError && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{apiError}</p>
          </div>
        )}

        <FormField>
          <FormLabel required>Name</FormLabel>
          <FormInput
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={() => { setTouched(t => ({ ...t, name: true })); setErrors(validate(name, industry, country, tier)) }}
            placeholder="SME business name"
            hasError={touched.name && !!errors.name}
          />
          <FormError message={touched.name ? errors.name : undefined} />
        </FormField>

        <FormField>
          <FormLabel required>Industry</FormLabel>
          <FormSelect
            value={industry}
            onChange={e => setIndustry(e.target.value)}
            hasError={touched.industry && !!errors.industry}
          >
            <option value="">Select industry…</option>
            {INDUSTRIES.map(i => (
              <option key={i} value={i}>{i}</option>
            ))}
          </FormSelect>
          <FormError message={touched.industry ? errors.industry : undefined} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField>
            <FormLabel required>Country</FormLabel>
            <FormInput
              value={country}
              maxLength={2}
              onChange={e => setCountry(e.target.value.toUpperCase())}
              hasError={touched.country && !!errors.country}
            />
            <FormError message={touched.country ? errors.country : undefined} />
          </FormField>
          <FormField>
            <FormLabel required>Tier</FormLabel>
            <FormSelect
              value={tier}
              onChange={e => setTier(e.target.value)}
              hasError={touched.tier && !!errors.tier}
            >
              {SUBSCRIPTION_TIERS.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </FormSelect>
            <FormError message={touched.tier ? errors.tier : undefined} />
          </FormField>
        </div>

        <FormActions>
          <FormCancelButton onClick={onClose} />
          <FormSubmitButton isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Create Client'}
          </FormSubmitButton>
        </FormActions>
      </form>
    </Modal>
  )
}
