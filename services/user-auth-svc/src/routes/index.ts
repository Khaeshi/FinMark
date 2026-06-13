import { Router } from 'express'
import {
  login, register, confirm,
  refresh, getProfile, logout,
  forgotPasswordHandler, resetPasswordHandler,
} from '../controllers/authController'
import { devLogin } from '../controllers/devAuthController'

const router = Router()

// ─── Dev bypass (no Cognito needed) ──────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  router.post('/dev-login', devLogin)
}

// ─── Real auth routes (require Cognito) ──────────────────────────────────────
router.post('/login',           login)
router.post('/register',        register)
router.post('/confirm',         confirm)
router.post('/refresh',         refresh)
router.post('/forgot-password', forgotPasswordHandler)
router.post('/reset-password',  resetPasswordHandler)

// protected
router.get('/profile',  getProfile)
router.post('/logout',  logout)

export { router as authRoutes }
