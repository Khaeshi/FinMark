import { Request, Response } from 'express'
import { z } from 'zod'
import { createLogger } from '@finmark/shared'
import { prisma } from '@finmark/db'
import jwt from 'jsonwebtoken'

const logger = createLogger('user-auth-svc:dev-auth')

const DEV_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'dev-secret-replace-in-production'
const IS_DEV = process.env.NODE_ENV !== 'production'

// ─── Dev Login (bypasses Cognito) ─────────────────────────────────────────────
// Only active in development. In production, use the real Cognito login.

export async function devLogin(req: Request, res: Response) {
  if (!IS_DEV) {
    return res.status(404).json({ success: false, error: 'Not found' })
  }

  const body = z.object({
    email:    z.string().email(),
    password: z.string(),
  }).safeParse(req.body)

  if (!body.success) {
    return res.status(400).json({ success: false, error: 'Invalid credentials' })
  }

  const { email } = body.data

  // find or create user in DB
  let user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    // auto-create dev user
    user = await prisma.user.create({
      data: {
        cognitoId: `dev-${email}`,
        email,
        name:      email.split('@')[0],
        role:      email.includes('admin') ? 'ADMIN' : 'VIEWER',
      },
    })
    logger.info('Dev user created', { email })
  }

  // generate a JWT token signed with our internal secret
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
}
