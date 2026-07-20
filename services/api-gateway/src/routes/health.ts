import { Router } from 'express'

const router = Router()

const SERVICES = [
  { name: 'api-gateway', url: null as string | null },
  { name: 'user-auth-svc', url: process.env.USER_AUTH_SVC_URL || 'http://localhost:4001' },
  { name: 'order-svc',     url: process.env.ORDER_SVC_URL     || 'http://localhost:4002' },
  { name: 'report-svc',    url: process.env.REPORT_SVC_URL    || 'http://localhost:4003' },
  { name: 'product-svc',   url: process.env.PRODUCT_SVC_URL   || 'http://localhost:4004' },
  { name: 'admin-svc',     url: process.env.ADMIN_SVC_URL     || 'http://localhost:4005' },
  { name: 'feedback-svc',  url: process.env.FEEDBACK_SVC_URL  || 'http://localhost:4006' },
]

async function checkService(name: string, baseUrl: string | null) {
  if (!baseUrl) {
    return { service: name, status: 'healthy' as const, latency: 0 }
  }

  const start = Date.now()
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 2000)
    const res = await fetch(`${baseUrl}/health`, { signal: controller.signal })
    clearTimeout(timer)
    const latency = Date.now() - start
    if (!res.ok) return { service: name, status: 'degraded' as const, latency }
    return { service: name, status: 'healthy' as const, latency }
  } catch {
    return { service: name, status: 'down' as const, latency: Date.now() - start }
  }
}

router.get('/', async (_req, res) => {
  const checks = await Promise.all(
    SERVICES.map(s => checkService(s.name, s.url))
  )

  const allHealthy = checks.every(c => c.status === 'healthy')
  const anyDown = checks.some(c => c.status === 'down')

  res.json({
    success: true,
    service: 'api-gateway',
    status: allHealthy ? 'healthy' : anyDown ? 'degraded' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: checks,
  })
})

export { router as healthRouter }
