/**
 * @author Khaesey Angel Tablante
 * @desc with codes generated from Claude
 * All rate limiter is set to large amount to visually/objectively hel p the scaling-demo.js in testing
 * since i cannot replicate multiple users in one ip adress.(simply idon't know XD)
 */



import rateLimit from 'express-rate-limit'

// general API rate limit — 200 employees, generous limit
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 12000,                   // 500 requests per window per IP
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
  max: 99999,                    // only 20 login attempts per window
  keyGenerator: (req) => { // to set ip to disable and allow concurrent user here
    return req.user?.sub || req.ip || 'unknown'
  },
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
  max: 9999999,                    // 60 requests/minute per user (1/sec)
  keyGenerator: (req) => {
    // limit per user, not per IP — fairer for office environments
    return req.user?.sub || req.ip || 'unknown'
  },
  message: {
    success: false,
    error: 'Dashboard request limit reached. Please wait a moment.',
  },
})
