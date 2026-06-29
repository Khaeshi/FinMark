/**
 * Draft 2 — Input Validation Tests
 * Proves the system handles missing/invalid data gracefully
 * Run: npx jest tests/unit/validation/inputValidation.test.ts
 */

import { z } from 'zod'

// ─── Schemas (copied from validate.ts for unit testing) ───────────────────────

const LoginSchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .transform(val => val.trim().toLowerCase()),
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

const OrderSchema = z.object({
  clientId:    z.string({ required_error: 'Client ID is required' }).min(1),
  amount:      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number'),
  currency:    z.string().length(3).optional(),
  description: z.string().max(255).optional(),
})

const FeedbackSchema = z.object({
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(100),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000),
  rating:  z.number().int().min(1).max(5).optional(),
})

// ─── Login Validation Tests ───────────────────────────────────────────────────

describe('Login Input Validation', () => {

  describe('Missing fields', () => {
    test('rejects empty body', () => {
      const result = LoginSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    test('rejects missing email', () => {
      const result = LoginSchema.safeParse({ password: 'password123' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email is required')
      }
    })

    test('rejects missing password', () => {
      const result = LoginSchema.safeParse({ email: 'admin@finmark.com' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password is required')
      }
    })

    test('rejects null email', () => {
      const result = LoginSchema.safeParse({ email: null, password: 'password123' })
      expect(result.success).toBe(false)
    })

    test('rejects empty string email', () => {
      const result = LoginSchema.safeParse({ email: '', password: 'password123' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Email is required')
      }
    })

    test('rejects empty string password', () => {
      const result = LoginSchema.safeParse({ email: 'admin@finmark.com', password: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password is required')
      }
    })
  })

  describe('Invalid formats', () => {
    test('rejects invalid email format', () => {
      const result = LoginSchema.safeParse({ email: 'notanemail', password: 'password123' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Please enter a valid email address')
      }
    })

    test('rejects email without domain', () => {
      const result = LoginSchema.safeParse({ email: 'admin@', password: 'password123' })
      expect(result.success).toBe(false)
    })

    test('rejects password under 6 characters', () => {
      const result = LoginSchema.safeParse({ email: 'admin@finmark.com', password: '123' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors[0].message).toBe('Password must be at least 6 characters')
      }
    })

    test('rejects whitespace-only email', () => {
      const result = LoginSchema.safeParse({ email: '   ', password: 'password123' })
      expect(result.success).toBe(false)
    })
  })

  describe('Valid inputs', () => {
    test('accepts valid credentials', () => {
      const result = LoginSchema.safeParse({
        email:    'admin@finmark.com',
        password: 'password123',
      })
      expect(result.success).toBe(true)
    })

    test('trims and lowercases email', () => {
      const result = LoginSchema.safeParse({
        email:    '  ADMIN@FINMARK.COM  ',
        password: 'password123',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.email).toBe('admin@finmark.com')
      }
    })
  })
})

// ─── Order Validation Tests ───────────────────────────────────────────────────

describe('Order Input Validation', () => {

  test('rejects missing clientId', () => {
    const result = OrderSchema.safeParse({ amount: '1000.00' })
    expect(result.success).toBe(false)
  })

  test('rejects invalid amount format', () => {
    const result = OrderSchema.safeParse({ clientId: 'c1', amount: 'not-a-number' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('valid number')
    }
  })

  test('rejects negative amount', () => {
    const result = OrderSchema.safeParse({ clientId: 'c1', amount: '-500' })
    expect(result.success).toBe(false)
  })

  test('rejects amount with too many decimals', () => {
    const result = OrderSchema.safeParse({ clientId: 'c1', amount: '100.999' })
    expect(result.success).toBe(false)
  })

  test('accepts valid order', () => {
    const result = OrderSchema.safeParse({
      clientId: 'client-001',
      amount:   '1250.50',
      currency: 'PHP',
    })
    expect(result.success).toBe(true)
  })

  test('accepts amount without decimals', () => {
    const result = OrderSchema.safeParse({ clientId: 'c1', amount: '5000' })
    expect(result.success).toBe(true)
  })
})

// ─── Feedback Validation Tests ────────────────────────────────────────────────

describe('Feedback Input Validation', () => {

  test('rejects missing subject', () => {
    const result = FeedbackSchema.safeParse({ message: 'This is my feedback message' })
    expect(result.success).toBe(false)
  })

  test('rejects subject too short', () => {
    const result = FeedbackSchema.safeParse({ subject: 'Hi', message: 'This is my feedback' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('3 characters')
    }
  })

  test('rejects message too short', () => {
    const result = FeedbackSchema.safeParse({ subject: 'My Subject', message: 'Short' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors[0].message).toContain('10 characters')
    }
  })

  test('rejects rating out of range', () => {
    const result = FeedbackSchema.safeParse({
      subject: 'My Subject',
      message: 'This is my feedback message here',
      rating:  6,
    })
    expect(result.success).toBe(false)
  })

  test('accepts valid feedback', () => {
    const result = FeedbackSchema.safeParse({
      subject: 'Great service',
      message: 'The platform has been very helpful for our business operations.',
      rating:  5,
    })
    expect(result.success).toBe(true)
  })

  test('accepts feedback without rating', () => {
    const result = FeedbackSchema.safeParse({
      subject: 'Great service',
      message: 'The platform has been very helpful for our business operations.',
    })
    expect(result.success).toBe(true)
  })
})

// ─── Null/Undefined Guard Tests ───────────────────────────────────────────────

describe('Null and Undefined Input Guards', () => {

  test('login rejects completely null body', () => {
    const result = LoginSchema.safeParse(null)
    expect(result.success).toBe(false)
  })

  test('login rejects undefined body', () => {
    const result = LoginSchema.safeParse(undefined)
    expect(result.success).toBe(false)
  })

  test('login rejects array instead of object', () => {
    const result = LoginSchema.safeParse(['admin@finmark.com', 'password'])
    expect(result.success).toBe(false)
  })

  test('login rejects string instead of object', () => {
    const result = LoginSchema.safeParse('admin@finmark.com')
    expect(result.success).toBe(false)
  })

  test('order rejects empty object', () => {
    const result = OrderSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
