'use client'
import { useState, useEffect, useMemo } from 'react'
import { sileo } from 'sileo'
import { isValidAmount, subtractAmounts } from '@finmark/shared'
import { Modal } from '@/components/ui/Modal'
import {
  FormField, FormLabel, FormInput, FormSelect,
  FormError, FormActions, FormSubmitButton, FormCancelButton,
} from '@/components/ui/Form'
import { useCreateFinancial } from '@/hooks/useCreateFinancial'
import { useClients } from '@/hooks/useClients'
import { useReports } from '@/hooks/useReports'
import { useAuth } from '@/lib/auth-context'
import { canManageClients } from '@/lib/role-checks'
import { formatPHP } from '@/lib/format'

interface FinancialRecord {
  id?:         string
  clientId:    string
  period:      string
  revenue:     string
  expenses:    string
  netProfit?:  string
  orderCount:  number
}

interface Props {
  isOpen:   boolean
  onClose:  () => void
  onSuccess?: () => void
  record?:  FinancialRecord | null
}

interface FieldErrors {
  clientId?:   string
  period?:     string
  revenue?:    string
  expenses?:   string
  orderCount?: string
}

const PERIOD_RE = /^\d{4}-Q[1-4]$/

function validate(
  clientId: string,
  period: string,
  revenue: string,
  expenses: string,
  orderCount: string,
  isEdit: boolean,
): FieldErrors {
  const errors: FieldErrors = {}
  if (!isEdit && !clientId) errors.clientId = 'Please select a client'
  if (!period.trim()) {
    errors.period = 'Period is required'
  } else if (!PERIOD_RE.test(period.trim())) {
    errors.period = 'Format must be YYYY-Q1 through YYYY-Q4'
  }
  if (!revenue.trim() || !isValidAmount(revenue.trim())) {
    errors.revenue = 'Enter a valid positive decimal amount'
  }
  if (!expenses.trim() || !isValidAmount(expenses.trim())) {
    errors.expenses = 'Enter a valid positive decimal amount'
  }
  const count = Number(orderCount)
  if (!orderCount.trim() || !Number.isInteger(count) || count < 0) {
    errors.orderCount = 'Order count must be a non-negative integer'
  }
  return errors
}

export function CreateFinancialModal({ isOpen, onClose, onSuccess, record }: Props) {
  const isEdit = !!record?.id
  const { user } = useAuth()
  const { createFinancial, updateFinancial, isLoading, error, reset } = useCreateFinancial()
  const canPickClient = canManageClients(user?.role)
  const { clients } = useClients()
  const { financials } = useReports()

  const clientOptions = useMemo(() => {
    if (canPickClient && clients.length > 0) {
      return clients.filter(c => c.isActive).map(c => ({ id: c.id, name: c.name }))
    }
    const map = new Map<string, string>()
    for (const f of financials) {
      if (f.clientId) map.set(f.clientId, f.client?.name || f.clientId.slice(0, 8))
    }
    if (user?.clientId && !map.has(user.clientId)) {
      map.set(user.clientId, 'Assigned client')
    }
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [canPickClient, clients, financials, user?.clientId])

  const [clientId, setClientId]     = useState('')
  const [period, setPeriod]         = useState('')
  const [revenue, setRevenue]       = useState('')
  const [expenses, setExpenses]     = useState('')
  const [orderCount, setOrderCount] = useState('0')
  const [errors, setErrors]         = useState<FieldErrors>({})
  const [touched, setTouched]       = useState<Record<string, boolean>>({})

  const netProfit = useMemo(() => {
    if (!isValidAmount(revenue) || !isValidAmount(expenses)) return '0.00'
    try {
      return subtractAmounts(revenue.trim(), expenses.trim())
    } catch {
      return '0.00'
    }
  }, [revenue, expenses])

  useEffect(() => {
    if (!isOpen) {
      reset()
      setErrors({})
      setTouched({})
      return
    }
    if (record) {
      setClientId(record.clientId)
      setPeriod(record.period)
      setRevenue(record.revenue)
      setExpenses(record.expenses)
      setOrderCount(String(record.orderCount ?? 0))
    } else {
      setClientId(user?.clientId && !canPickClient ? user.clientId : '')
      setPeriod('')
      setRevenue('')
      setExpenses('')
      setOrderCount('0')
    }
  }, [isOpen, record, reset, user?.clientId, canPickClient])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({ clientId: true, period: true, revenue: true, expenses: true, orderCount: true })
    const fieldErrors = validate(clientId, period, revenue, expenses, orderCount, isEdit)
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }

    let ok = false
    if (isEdit && record?.id) {
      ok = await updateFinancial(record.id, {
        revenue: revenue.trim(),
        expenses: expenses.trim(),
        orderCount: Number(orderCount),
      })
    } else {
      ok = await createFinancial({
        clientId,
        period: period.trim(),
        revenue: revenue.trim(),
        expenses: expenses.trim(),
        orderCount: Number(orderCount),
      })
    }

    if (ok) {
      sileo.success({ title: isEdit ? 'Record updated' : 'Financial record added' })
      onSuccess?.()
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Financial Record' : 'Add Financial Record'}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!isEdit && (
          <FormField>
            <FormLabel required>Client</FormLabel>
            <FormSelect
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              hasError={touched.clientId && !!errors.clientId}
            >
              <option value="">Select SME client…</option>
              {clientOptions.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </FormSelect>
            <FormError message={touched.clientId ? errors.clientId : undefined} />
          </FormField>
        )}

        <FormField>
          <FormLabel required>Period</FormLabel>
          <FormInput
            value={period}
            onChange={e => setPeriod(e.target.value)}
            placeholder="2024-Q1"
            disabled={isEdit}
            hasError={touched.period && !!errors.period}
          />
          <FormError message={touched.period ? errors.period : undefined} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField>
            <FormLabel required>Revenue</FormLabel>
            <FormInput
              value={revenue}
              onChange={e => setRevenue(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              hasError={touched.revenue && !!errors.revenue}
            />
            <FormError message={touched.revenue ? errors.revenue : undefined} />
          </FormField>
          <FormField>
            <FormLabel required>Expenses</FormLabel>
            <FormInput
              value={expenses}
              onChange={e => setExpenses(e.target.value)}
              placeholder="0.00"
              inputMode="decimal"
              hasError={touched.expenses && !!errors.expenses}
            />
            <FormError message={touched.expenses ? errors.expenses : undefined} />
          </FormField>
        </div>

        <FormField>
          <FormLabel>Net Profit (auto)</FormLabel>
          <FormInput value={formatPHP(netProfit)} disabled readOnly />
        </FormField>

        <FormField>
          <FormLabel required>Order Count</FormLabel>
          <FormInput
            type="number"
            min={0}
            step={1}
            value={orderCount}
            onChange={e => setOrderCount(e.target.value)}
            hasError={touched.orderCount && !!errors.orderCount}
          />
          <FormError message={touched.orderCount ? errors.orderCount : undefined} />
        </FormField>

        <FormActions>
          <FormCancelButton onClick={onClose} />
          <FormSubmitButton isLoading={isLoading}>
            {isEdit ? 'Save Changes' : 'Add Record'}
          </FormSubmitButton>
        </FormActions>
      </form>
    </Modal>
  )
}
