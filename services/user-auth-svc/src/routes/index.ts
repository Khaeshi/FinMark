import { Router } from 'express'
import {
  login, register, confirm,
  refresh, getProfile, logout,
  forgotPasswordHandler, resetPasswordHandler,
} from '../controllers/authController.js'

const router = Router()


router.post('/login',          login)
router.post('/register',       register)
router.post('/confirm',        confirm)
router.post('/refresh',        refresh)
router.post('/forgot-password', forgotPasswordHandler)
router.post('/reset-password', resetPasswordHandler)

// protected routes (req.user injected by api-gateway)
router.get('/profile',  getProfile)
router.post('/logout',  logout)

export { router as authRoutes }
