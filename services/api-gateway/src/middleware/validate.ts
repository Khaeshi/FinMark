/**
 * @author Khaesey Angel Tablante
 */

import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import type { ZodTypeAny } from 'zod'

export function validate(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const errors = result.error.issues.map((err) => ({
        field:   err.path.join('.') || 'input',
        message: err.message,
      }))

      return res.status(400).json({
        success: false,
        error:   'Validation failed',
        details: errors,
        message: errors[0]?.message || 'Invalid input provided',
      })
    }

    req.body = result.data
    next()
  }
}

export const LoginSchema = z.object({
  email:    z.string({ error: 'Email is required' })
              .min(1, 'Email is required')
              .email('Please enter a valid email address')
              .toLowerCase()
              .trim(),
  password: z.string({ error: 'Password is required' })
              .min(1, 'Password is required')
              .min(6, 'Password must be at least 6 characters'),
})

export const RegisterSchema = z.object({
  email:    z.string({ error: 'Email is required' })
              .min(1, 'Email is required')
              .email('Please enter a valid email address')
              .toLowerCase()
              .trim(),
  password: z.string({ error: 'Password is required' })
              .min(8, 'Password must be at least 8 characters'),
  name:     z.string({ error: 'Name is required' })
              .min(2, 'Name must be at least 2 characters')
              .trim(),
})

export const PaginationSchema = z.object({
  page:  z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}).partial()