import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { requireRole } from '../middleware/auth.js'

const router = Router()

// service URLs — in production these come from env/service discovery
const SERVICES = {
  auth:     process.env.USER_AUTH_SVC_URL    || 'http://localhost:4001',
  orders:   process.env.ORDER_SVC_URL        || 'http://localhost:4002',
  reports:  process.env.REPORT_SVC_URL       || 'http://localhost:4003',
  products: process.env.PRODUCT_SVC_URL      || 'http://localhost:4004',
  admin:    process.env.ADMIN_SVC_URL        || 'http://localhost:4005',
  feedback: process.env.FEEDBACK_SVC_URL     || 'http://localhost:4006',
}

function makeProxy(target: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    on: {
      error: (err, req, res: any) => {
        console.error(JSON.stringify({
          level: 'error',
          service: 'api-gateway',
          message: `Proxy error to ${target}`,
          error: err.message,
          timestamp: new Date().toISOString(),
        }))
        res.status(503).json({ success: false, error: 'Service temporarily unavailable' })
      },
    },
  })
}

/**
 * Auth Service
 */
router.use('/auth', makeProxy(SERVICES.auth))

/**
 * Orders Service
 */
router.use(
  '/orders',
  requireRole('SUPERADMIN', 'ADMIN', 'OPERATIONS'),
  makeProxy(SERVICES.orders)
)

/**
 * Reports Service
 */
router.use(
  '/reports',
  requireRole('SUPERADMIN', 'ADMIN', 'FINANCE', 'ANALYST'),
  makeProxy(SERVICES.reports)
)

/**
 * Products Service
 */
router.use(
  '/products',
  requireRole('SUPERADMIN', 'ADMIN', 'OPERATIONS'),
  makeProxy(SERVICES.products)
)

/**
 * Admin Service
 */
router.use(
  '/admin',
  requireRole('SUPERADMIN', 'ADMIN'),
  makeProxy(SERVICES.admin)
)

/**
 * Feedback Service
 */
router.use('/feedback', makeProxy(SERVICES.feedback))

/**
 * Dashboard
 */
router.use(
  '/dashboard',
  requireRole('SUPERADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'ANALYST', 'VIEWER'),
  makeProxy(SERVICES.reports)   // report-svc owns dashboard data
)

export { router as proxyRoutes }
