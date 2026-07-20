/**
 * @author Khaesey Angel Tablante
 * @desc Rate limiters for API gateway.
 * Production limits apply to real traffic. k6 sends x-load-test: true so the
 * scaling demo is not blocked by per-IP limits (all VUs share one IP).
 */

import rateLimit from 'express-rate-limit'

function skipLoadTestOrDev(req: { path?: string; headers: Record<string, unknown> }) {
  return (
    req.path === '/health' ||
    req.headers['x-load-test'] === 'true' ||
    process.env.NODE_ENV === 'development'
  )
}

// general API rate limit — 200 employees, generous limit
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  skip: (req) => skipLoadTestOrDev(req),
})

// strict limit for auth routes — prevents brute force
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    return req.user?.sub || req.ip || 'unknown'
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  skip: (req) =>
    req.headers['x-load-test'] === 'true' || process.env.NODE_ENV === 'development',
})

// dashboard-specific limiter — 200 concurrent users
export const dashboardRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  keyGenerator: (req) => {
    return req.user?.sub || req.ip || 'unknown'
  },
  message: {
    success: false,
    error: 'Dashboard request limit reached. Please wait a moment.',
  },
  skip: (req) =>
    req.headers['x-load-test'] === 'true' || process.env.NODE_ENV === 'development',
})
