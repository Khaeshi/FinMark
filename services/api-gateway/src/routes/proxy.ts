import { Router } from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { requireRole } from '../middleware/auth'

const router = Router()

/**
 * Service URLs - in production these comes from env/service discovery,
 * the hardcoded localhost will be remove by me once production hits
 */
const SERVICES = {
  auth:     process.env.USER_AUTH_SVC_URL    || 'http://localhost:4001',
  orders:   process.env.ORDER_SVC_URL        || 'http://localhost:4002',
  reports:  process.env.REPORT_SVC_URL       || 'http://localhost:4003',
  products: process.env.PRODUCT_SVC_URL      || 'http://localhost:4004',
  admin:    process.env.ADMIN_SVC_URL        || 'http://localhost:4005',
  feedback: process.env.FEEDBACK_SVC_URL     || 'http://localhost:4006',
}

function makeProxy(target: string, rewrite?: Record<string, string>) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    proxyTimeout: 5000,
    timeout: 5000,
    pathRewrite: rewrite,
    on: {
      proxyReq: (proxyReq, req: any) => {
        // forward decoded user info to downstream services
        if (req.user) {
          proxyReq.setHeader('x-user-id', req.user.sub)
          proxyReq.setHeader('x-user-role', req.user.role)
          if (req.user.email) {
            proxyReq.setHeader('x-user-email', req.user.email)
          }
          if (req.user.clientId) {
            proxyReq.setHeader('x-user-client-id', req.user.clientId)
          }
        }

        if (req.body && Object.keys(req.body).length > 0) {
          const bodyData = JSON.stringify(req.body)
          proxyReq.setHeader('Content-Type', 'application/json')
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData))
          proxyReq.write(bodyData)
        }
      },
      error: (err, req, res: any) => {
        console.error(JSON.stringify({
          level: 'error', service: 'api-gateway',
          message: `Proxy error to ${target}`, error: err.message,
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
router.use('/auth', makeProxy(SERVICES.auth,  { '^/auth': '' }))

/**
 * Orders Service
 */
router.use(
  '/orders',
  requireRole('SUPERADMIN', 'ADMIN', 'OPERATIONS'),
  makeProxy(SERVICES.orders,   { '^/orders': '' })
)

/**
 * Reports Service
 */
router.use(
  '/reports',
  requireRole('SUPERADMIN', 'ADMIN', 'FINANCE', 'ANALYST'),
  makeProxy(SERVICES.reports,  { '^/reports': '' })
)

/**
 * Products Service
 */
router.use(
  '/products',
  requireRole('SUPERADMIN', 'ADMIN', 'OPERATIONS'),
  makeProxy(SERVICES.products, { '^/products': '' })
)

/**
 * Admin Service
 */
router.use(
  '/admin',
  requireRole('SUPERADMIN', 'ADMIN'),
  makeProxy(SERVICES.admin,    { '^/admin': '' })
)

/**
 * Feedback Service
 */
router.use('/feedback', makeProxy(SERVICES.feedback, { '^/feedback': '' }))

/**
 * Dashboard
 */
router.use(
  '/dashboard',
  requireRole('SUPERADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'ANALYST', 'VIEWER'),
  // dashboard routes are defined in report-svc under '/dashboard/...'
  makeProxy(SERVICES.reports, { '^/dashboard': '/dashboard' })
)

export { router as proxyRoutes }
