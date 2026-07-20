/**
 * @author Khaesey Angel Tablante
 * @desc Production Auth Cognito
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import { createLogger } from '@finmark/shared'
import {
  signIn, signUp, confirmSignUp,
  refreshSession, forgotPassword,
  confirmForgotPassword, signOut,
  getUserFromToken,
} from '../services/cognitoService'
import { syncUserToDatabase, getUserProfile, logAuditEvent } from '../services/sessionService'

const logger = createLogger('user-auth-svc:controller')

/**
 * Validation Schema
 */
const LoginSchema = z.object({
  email:    z.string({
    required_error: 'Email is required',
  })
  .min(1, 'Email is required')            
  .email('Please enter a valid email address')
  .toLowerCase()
  .trim(),
  password: z.string({
    required_error: 'Password is required',
  }).min(8)
  .min(1, 'Password is required')
  .min(8, 'Password must be at least 8 characters')
  .max (128, 'Password is too long'),
})

const RegisterSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(8),
  name:     z.string().min(2),
})

const ConfirmSchema = z.object({
  email: z.string().email(),
  code:  z.string().length(6),
})

const RefreshSchema = z.object({
  refreshToken: z.string(),
})

/**
 * Login
 * @param req 
 * @param res 
 * @returns 
 */
export async function login(req: Request, res: Response) {
  try {
    const body = LoginSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: 'Invalid email or password format' })
    }

    const { email, password } = body.data
    const result = await signIn(email, password)

    // MFA or password change challenge
    if ('challenge' in result) {
      return res.json({ success: true, challenge: result.challenge, session: result.session })
    }

    // get user info from Cognito and sync to DB
    const cognitoUser = await getUserFromToken(result.accessToken!)
    const dbUser = await syncUserToDatabase(
      cognitoUser.cognitoId!,
      cognitoUser.email!,
      cognitoUser.name!
    )

    // audit log
    await logAuditEvent(
      dbUser.id,
      'USER_LOGIN',
      req.ip,
      req.headers['user-agent']
    )

    logger.info('User logged in', { userId: dbUser.id, email })

    return res.json({
      success: true,
      data: {
        accessToken:  result.accessToken,
        idToken:      result.idToken,
        refreshToken: result.refreshToken,
        expiresIn:    result.expiresIn,
        user: {
          id:       dbUser.id,
          email:    dbUser.email,
          name:     dbUser.name,
          role:     dbUser.role,
          clientId: dbUser.clientId,
        },
      },
    })
  } catch (err: any) {
    // Cognito error codes
    if (err.name === 'NotAuthorizedException') {
      return res.status(401).json({ success: false, error: 'Incorrect email or password' })
    }
    if (err.name === 'UserNotFoundException') {
      return res.status(401).json({ success: false, error: 'Incorrect email or password' })
    }
    if (err.name === 'UserNotConfirmedException') {
      return res.status(403).json({ success: false, error: 'Please confirm your email first' })
    }

    logger.error('Login failed', err, req.requestId)
    return res.status(500).json({ success: false, error: 'Login failed' })
  }
}

/**
 * Register
 * @param req 
 * @param res 
 * @returns 
 */
export async function register(req: Request, res: Response) {
  try {
    const body = RegisterSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.errors[0].message })
    }

    const { email, password, name } = body.data
    const result = await signUp(email, password, name)

    logger.info('User registered', { email })

    return res.status(201).json({
      success: true,
      data: {
        userSub:            result.userSub,
        confirmationNeeded: result.confirmationNeeded,
        message: result.confirmationNeeded
          ? 'Check your email for a confirmation code'
          : 'Registration complete',
      },
    })
  } catch (err: any) {
    if (err.name === 'UsernameExistsException') {
      return res.status(409).json({ success: false, error: 'An account with this email already exists' })
    }
    if (err.name === 'InvalidPasswordException') {
      return res.status(400).json({ success: false, error: 'Password does not meet requirements' })
    }

    logger.error('Registration failed', err, req.requestId)
    return res.status(500).json({ success: false, error: 'Registration failed' })
  }
}

/**
 * Confirm Email
 * @param req 
 * @param res 
 * @returns 
 */
export async function confirm(req: Request, res: Response) {
  try {
    const body = ConfirmSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: 'Invalid confirmation data' })
    }

    await confirmSignUp(body.data.email, body.data.code)
    return res.json({ success: true, message: 'Email confirmed. You can now log in.' })
  } catch (err: any) {
    if (err.name === 'CodeMismatchException') {
      return res.status(400).json({ success: false, error: 'Invalid confirmation code' })
    }
    if (err.name === 'ExpiredCodeException') {
      return res.status(400).json({ success: false, error: 'Confirmation code has expired' })
    }
    logger.error('Confirmation failed', err, req.requestId)
    return res.status(500).json({ success: false, error: 'Confirmation failed' })
  }
}

/**
 * Refresh Token
 * @param req 
 * @param res 
 * @returns 
 */
export async function refresh(req: Request, res: Response) {
  try {
    const body = RefreshSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: 'Refresh token required' })
    }

    const result = await refreshSession(body.data.refreshToken)
    return res.json({ success: true, data: result })
  } catch (err) {
    logger.error('Token refresh failed', err, req.requestId)
    return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' })
  }
}

/**
 * Get Profile
 * @param req 
 * @param res 
 * @returns 
 */
export async function getProfile(req: Request, res: Response) {
  try {
    if (!req.user?.sub) {
      return res.status(401).json({ success: false, error: 'Unauthorized' })
    }
    const profile = await getUserProfile(req.user.sub)
    if (!profile) {
      return res.status(404).json({ success: false, error: 'User not found' })
    }
    return res.json({ success: true, data: profile })
  } catch (err) {
    logger.error('Get profile failed', err, req.requestId)
    return res.status(500).json({ success: false, error: 'Failed to get profile' })
  }
}

/**
 * Log out 
 * @param req 
 * @param res 
 * @returns 
 */
export async function logout(req: Request, res: Response) {
  try {
    const authHeader = req.headers.authorization
    const token = authHeader?.split(' ')[1]
    if (token) {
      await signOut(token)
      await logAuditEvent(req.user!.sub, 'USER_LOGOUT', req.ip, req.headers['user-agent'])
    }
    return res.json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    // non-fatal — token may already be expired
    return res.json({ success: true, message: 'Logged out' })
  }
}

/**
 * Forgot Password
 * @param req Request email 
 * @param res 
 * @returns always returns success, email exists should'nt be revealed here 
 */
export async function forgotPasswordHandler(req: Request, res: Response) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body)
    await forgotPassword(email)
    return res.json({ success: true, message: 'If that email exists, a reset code has been sent.' })
  } catch (err) {
    return res.json({ success: true, message: 'If that email exists, a reset code has been sent.' })
  }
}

/**
 * Reset Password
 * @param req Request email
 * @param res Confirm new Password
 * @returns Success when reset is complete
 */
export async function resetPasswordHandler(req: Request, res: Response) {
  try {
    const body = z.object({
      email:       z.string().email(),
      code:        z.string(),
      newPassword: z.string().min(8),
    }).parse(req.body)

    await confirmForgotPassword(body.email, body.code, body.newPassword)
    return res.json({ success: true, message: 'Password reset successfully' })
  } catch (err: any) {
    if (err.name === 'CodeMismatchException') {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset code' })
    }
    logger.error('Password reset failed', err, req.requestId)
    return res.status(500).json({ success: false, error: 'Password reset failed' })
  }
}
