/**
 * Milestone 2 Draft 2 — Validation Tests
 * Tests robust error handling for missing or invalid user input
 * Scenario: Form submitted with missing email or password
 */

import { z } from 'zod'

// ─── Schemas (mirrors what services use) ──────────────────────────────────────

const LoginSchema = z.object({
  email:    z.string({ required_error: 'Email is required' }).min(1, 'Email is required').email('Please enter a valid email address').toLowerCase().trim(),
  password: z.string({ required_error: 'Password is required' }).min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
})

const RegisterSchema = z.object({
  email:    z.string({ required_error: 'Email is required' }).min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string({ required_error: 'Password is required' }).min(8, 'Password must be at least 8 characters'),
  name:     z.string({ required_error: 'Name is required' }).min(2, 'Name must be at least 2 characters'),
})

// ─── Login Validation Tests ───────────────────────────────────────────────────

describe('Login Validation — Missing or Invalid Inputs', () => {

  test('rejects empty body', () => {
    const result = LoginSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      const fields = result.error.errors.map(e => e.path[0])
      expect(fields).toContain('email')
      expect(fields).toContain('password')
    }
  })

  test('rejects missing email', () => {
    const result = LoginSchema.safeParse({ password: 'validpassword' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.errors.find(e => e.path[0] === 'email')
      expect(emailError).toBeDefined()
      expect(emailError?.message).toBe('Email is required')
    }
  })

  test('rejects missing password', () => {
    const result = LoginSchema.safeParse({ email: 'admin@finmark.com' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passError = result.error.errors.find(e => e.path[0] === 'password')
      expect(passError).toBeDefined()
      expect(passError?.message).toBe('Password is required')
    }
  })

  test('rejects invalid email format', () => {
    const result = LoginSchema.safeParse({ email: 'notanemail', password: 'validpassword' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const emailError = result.error.errors.find(e => e.path[0] === 'email')
      expect(emailError?.message).toBe('Please enter a valid email address')
    }
  })

  test('rejects empty string email', () => {
    const result = LoginSchema.safeParse({ email: '', password: 'validpassword' })
    expect(result.success).toBe(false)
  })

  test('rejects password shorter than 6 characters', () => {
    const result = LoginSchema.safeParse({ email: 'admin@finmark.com', password: '123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passError = result.error.errors.find(e => e.path[0] === 'password')
      expect(passError?.message).toBe('Password must be at least 6 characters')
    }
  })

  test('rejects null values', () => {
    const result = LoginSchema.safeParse({ email: null, password: null })
    expect(result.success).toBe(false)
  })

  test('rejects undefined values', () => {
    const result = LoginSchema.safeParse({ email: undefined, password: undefined })
    expect(result.success).toBe(false)
  })

  test('accepts valid credentials', () => {
    const result = LoginSchema.safeParse({
      email:    'admin@finmark.com',
      password: 'validpassword123',
    })
    expect(result.success).toBe(true)
  })

  test('normalizes email to lowercase', () => {
    const result = LoginSchema.safeParse({
      email:    'ADMIN@FINMARK.COM',
      password: 'validpassword123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('admin@finmark.com')
    }
  })

  test('trims whitespace from email', () => {
    const result = LoginSchema.safeParse({
      email:    '  admin@finmark.com  ',
      password: 'validpassword123',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.email).toBe('admin@finmark.com')
    }
  })
})

// ─── Register Validation Tests ────────────────────────────────────────────────

describe('Register Validation — Missing or Invalid Inputs', () => {

  test('rejects empty registration form', () => {
    const result = RegisterSchema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors.length).toBeGreaterThanOrEqual(3)
    }
  })

  test('rejects missing name', () => {
    const result = RegisterSchema.safeParse({
      email: 'user@finmark.com',
      password: 'validpassword',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const nameError = result.error.errors.find(e => e.path[0] === 'name')
      expect(nameError?.message).toBe('Name is required')
    }
  })

  test('rejects password shorter than 8 characters for registration', () => {
    const result = RegisterSchema.safeParse({
      email:    'user@finmark.com',
      password: 'short',
      name:     'Test User',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const passError = result.error.errors.find(e => e.path[0] === 'password')
      expect(passError?.message).toBe('Password must be at least 8 characters')
    }
  })

  test('accepts valid registration data', () => {
    const result = RegisterSchema.safeParse({
      email:    'newuser@finmark.com',
      password: 'securepassword123',
      name:     'New User',
    })
    expect(result.success).toBe(true)
  })
})

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('Edge Cases — Unusual Inputs', () => {

  test('rejects SQL injection attempt in email', () => {
    const result = LoginSchema.safeParse({
      email:    "'; DROP TABLE users; --",
      password: 'password',
    })
    expect(result.success).toBe(false)
  })

  test('rejects XSS attempt in email', () => {
    const result = LoginSchema.safeParse({
      email:    '<script>alert("xss")</script>@test.com',
      password: 'password',
    })
    expect(result.success).toBe(false)
  })

  test('rejects number as email', () => {
    const result = LoginSchema.safeParse({ email: 12345, password: 'password' })
    expect(result.success).toBe(false)
  })

  test('rejects array as password', () => {
    const result = LoginSchema.safeParse({ email: 'admin@finmark.com', password: [] })
    expect(result.success).toBe(false)
  })
})
