import rateLimit from 'express-rate-limit'

// general API rate limit — 200 employees, generous limit
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 500,                   // 500 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests, please try again later.',
  },
  skip: (req) => {
    // skip rate limiting for internal health checks
    return req.path === '/health'
  },
})

// strict limit for auth routes — prevents brute force
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 20,                    // only 20 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
})

// dashboard-specific limiter — 200 concurrent users
export const dashboardRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,   // 1 minute window
  max: 60,                    // 60 requests/minute per user (1/sec)
  keyGenerator: (req) => {
    // limit per user, not per IP — fairer for office environments
    return req.user?.sub || req.ip || 'unknown'
  },
  message: {
    success: false,
    error: 'Dashboard request limit reached. Please wait a moment.',
  },
})
