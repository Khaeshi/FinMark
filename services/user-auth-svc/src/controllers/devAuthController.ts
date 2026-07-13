/**
 * @author Khaesey Angel Tablante
 * @desc DevBypass Auth
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { createLogger } from '@finmark/shared'
import { prisma } from '@finmark/db'
import jwt from 'jsonwebtoken'

const logger = createLogger('user-auth-svc:dev-auth')
const DEV_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'dev-secret-replace-in-production'
const IS_DEV = process.env.NODE_ENV !== 'production'

/**
 * Validation Schema
 * @desc 
 */
const DevLoginSchema = z.object({
  email: z.string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  })
  .min(1, 'Email cannot be empty')
  .email('Please provide a valid email address')
  .toLowerCase()
  .trim(),

  password: z.string({
    required_error: 'Password is required',
    invalid_type_error: 'Password must be a string',
  })
  .min(1, 'Password cannot be empty'),
})

export async function devLogin(req: Request, res: Response) {
  if (!IS_DEV) {
    return res.status(404).json({ success: false, error: 'Not found' })
  }

  // validate input
  const parsed = DevLoginSchema.safeParse(req.body)
  if (!parsed.success) {
    const errors = parsed.error.errors.map(e => ({
      field:   e.path.join('.') || 'input',
      message: e.message,
    }))
    return res.status(400).json({
      success: false,
      error:   'Validation failed',
      details: errors,
      message: errors[0]?.message || 'Invalid credentials format',
    })
  }

  const { email } = parsed.data

  try {
    // find or create user in DB
    let user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      user = await prisma.user.create({
        data: {
          cognitoId: `dev-${email}-${Date.now()}`,
          email,
          name:  email.split('@')[0],
          role:  email.includes('admin') ? 'ADMIN' : 'VIEWER',
        },
      })
      logger.info('Dev user auto-created', { email })
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error:   'Account is deactivated. Contact your administrator.',
      })
    }

    // update last login
    await prisma.user.update({
      where: { id: user.id },
      data:  { lastLoginAt: new Date() },
    })

    const token = jwt.sign(
      {
        sub:      user.cognitoId,
        email:    user.email,
        role:     user.role,
        clientId: user.clientId,
      },
      DEV_SECRET,
      { expiresIn: '8h' }
    )

    logger.info('Dev login successful', { email, role: user.role })

    return res.json({
      success: true,
      data: {
        accessToken:  token,
        idToken:      token,
        refreshToken: token,
        expiresIn:    28800,
        user: {
          id:       user.id,
          email:    user.email,
          name:     user.name,
          role:     user.role,
          clientId: user.clientId,
        },
      },
    })

  } catch (err: any) {
    logger.error('Dev login error', err)

    // handle known DB errors
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        error: 'Account conflict. Please contact support.',
      })
    }

    return res.status(500).json({
      success: false,
      error: 'Login service unavailable. Please try again.',
    })
  }
}
