/**
 * App-layer WAF for FinMark API Gateway.
 * Lightweight OWASP-style checks — path probes, SQLi/XSS in query & JSON body.
 * Not a full ModSecurity replacement; enough for Railway deploy + live demo.
 */

import type { Request, Response, NextFunction } from 'express'
import type { Counter } from 'prom-client'

const SKIP_PREFIXES = ['/health', '/metrics']

/** Probe / traversal paths commonly used by scanners */
const SUSPICIOUS_PATH = /(\.\.|\/\.env|\/wp-admin|\/phpmyadmin|\.php\b|\.asp\b|\.aspx\b|\/etc\/passwd|\/proc\/self)/i

/**
 * SQLi / XSS — tuned to avoid matching normal emails, amounts, or prose.
 * Require classic injection shapes, not lone apostrophes.
 */
const SQLI = /(\bunion\b[\s/+]*\bselect\b|\bor\b\s+['"]?\d+['"]?\s*=\s*['"]?\d+|'\s*or\s+'?\d|'?\s*or\s*1\s*=\s*1|--\s*$|;\s*(drop|delete|insert|update)\b|\bsleep\s*\(|\bbenchmark\s*\()/i

const XSS = /(<\s*script\b|javascript\s*:|on(error|load|click)\s*=|<\s*iframe\b|<\s*svg\b[^>]*on\w+)/i

let blocksTotal = 0
const blocksByRule: Record<string, number> = {}
let promCounter: Counter | null = null

export function setWafPromCounter(counter: Counter) {
  promCounter = counter
}

export function getWafStats() {
  return {
    enabled: true,
    blocksTotal,
    byRule: { ...blocksByRule },
  }
}

function bump(rule: string) {
  blocksTotal += 1
  blocksByRule[rule] = (blocksByRule[rule] || 0) + 1
  promCounter?.inc({ rule })
}

function denyList(): Set<string> {
  const raw = process.env.WAF_DENY_IPS || ''
  return new Set(
    raw
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )
}

function clientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim()
  }
  return req.ip || req.socket.remoteAddress || ''
}

function scanString(value: string): string | null {
  if (SQLI.test(value)) return 'sqli'
  if (XSS.test(value)) return 'xss'
  return null
}

function scanObject(value: unknown, depth = 0): string | null {
  if (depth > 8 || value == null) return null
  if (typeof value === 'string') return scanString(value)
  if (Array.isArray(value)) {
    for (const item of value) {
      const hit = scanObject(item, depth + 1)
      if (hit) return hit
    }
    return null
  }
  if (typeof value === 'object') {
    for (const v of Object.values(value as Record<string, unknown>)) {
      const hit = scanObject(v, depth + 1)
      if (hit) return hit
    }
  }
  return null
}

function block(res: Response, req: Request, rule: string) {
  bump(rule)
  console.error(JSON.stringify({
    level: 'warn',
    service: 'api-gateway',
    message: 'WAF blocked request',
    rule,
    path: req.path,
    method: req.method,
    ip: clientIp(req),
    timestamp: new Date().toISOString(),
  }))
  return res.status(403).json({
    success: false,
    error: 'Request blocked by WAF',
    code: 'WAF_BLOCKED',
    rule,
  })
}

export function wafMiddleware(req: Request, res: Response, next: NextFunction) {
  if (SKIP_PREFIXES.some(p => req.path === p || req.path.startsWith(p + '/'))) {
    return next()
  }

  // Only gate API traffic
  if (!req.path.startsWith('/api')) {
    return next()
  }

  const denied = denyList()
  if (denied.size > 0) {
    const ip = clientIp(req)
    if (denied.has(ip)) {
      return block(res, req, 'ip_deny')
    }
  }

  const fullPath = `${req.path}${req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''}`
  if (SUSPICIOUS_PATH.test(req.path) || SUSPICIOUS_PATH.test(fullPath)) {
    return block(res, req, 'suspicious_path')
  }

  // Query string (decoded by Express)
  const queryBlob = Object.entries(req.query)
    .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : String(v ?? '')}`)
    .join('&')

  if (queryBlob) {
    const qHit = scanString(queryBlob) || scanString(decodeURIComponent(safeDecode(queryBlob)))
    if (qHit === 'sqli') return block(res, req, 'sqli_query')
    if (qHit === 'xss') return block(res, req, 'xss_query')
  }

  // Body content-type for mutating methods
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const ct = (req.headers['content-type'] || '').toLowerCase()
    if (ct && !ct.includes('application/json') && !ct.includes('application/x-www-form-urlencoded')) {
      return block(res, req, 'content_type')
    }
  }

  if (req.body && typeof req.body === 'object') {
    const bodyHit = scanObject(req.body)
    if (bodyHit === 'sqli') return block(res, req, 'sqli_body')
    if (bodyHit === 'xss') return block(res, req, 'xss_body')
  }

  return next()
}

function safeDecode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}
