/**
 * Financial math utilities for Finmark.
 * NEVER use JavaScript float arithmetic for money.
 * All amounts are stored and passed as strings, computed as BigInt cents.
 */

const PRECISION = 100n // 2 decimal places = work in cents

export function toCents(amount: string): bigint {
  const [whole, fraction = '0'] = amount.replace(/,/g, '').split('.')
  const cents = fraction.padEnd(2, '0').slice(0, 2)
  return BigInt(whole) * PRECISION + BigInt(cents)
}

export function fromCents(cents: bigint): string {
  const isNegative = cents < 0n
  const abs = isNegative ? -cents : cents
  const whole = abs / PRECISION
  const fraction = (abs % PRECISION).toString().padStart(2, '0')
  return `${isNegative ? '-' : ''}${whole}.${fraction}`
}

export function addAmounts(a: string, b: string): string {
  return fromCents(toCents(a) + toCents(b))
}

export function subtractAmounts(a: string, b: string): string {
  return fromCents(toCents(a) - toCents(b))
}

export function multiplyAmount(amount: string, factor: number): string {
  // multiply in cents to avoid float issues
  const cents = toCents(amount)
  const factorCents = BigInt(Math.round(factor * 100))
  return fromCents((cents * factorCents) / PRECISION)
}

export function formatCurrency(amount: string, currency = 'PHP'): string {
  const num = parseFloat(amount)
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(num)
}

export function isValidAmount(amount: string): boolean {
  return /^\d+(\.\d{1,2})?$/.test(amount.replace(/,/g, ''))
}
