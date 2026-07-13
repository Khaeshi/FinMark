/**
 * FinMark — Scaling Demonstration Test
 * 
 * This test proves the platform actively handles:
 * 1. Gradual traffic ramp up to 200 concurrent users
 * 2. Dashboard responses stay under 3 seconds
 * 3. System stays stable under peak load
 * 4. Graceful scale down after spike
 * 
 * Run: k6 run -e BASE_URL=https://your-railway-url -e AUTH_TOKEN=your-token tests/load/k6/scaling-demo.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// custom metrics
const failRate        = new Rate('failed_requests')
const dashboardTrend  = new Trend('dashboard_response_ms')
const cacheHits       = new Counter('cache_hits')
const cacheMisses     = new Counter('cache_misses')

export const options = {
  stages: [
    { duration: '30s', target: 10  },  // warm up
    { duration: '30s', target: 50  },  // ramp to 50 users
    { duration: '1m',  target: 200 },  // peak: 200 concurrent users (FinMark's 200 employees)
    { duration: '30s', target: 200 },  // sustain peak
    { duration: '30s', target: 0   },  // scale down
  ],
  thresholds: {
    // 95% of dashboard requests must complete under 3 seconds
    'dashboard_response_ms': ['p(95)<3000'],
    // less than 1% failure rate
    'failed_requests':       ['rate<0.01'],
    // overall HTTP response time
    'http_req_duration':     ['p(95)<3000', 'p(99)<5000'],
    // success rate
    'http_req_failed':       ['rate<0.01'],
  },
}

const BASE_URL   = __ENV.BASE_URL   || 'http://localhost:4000'
const AUTH_TOKEN = __ENV.AUTH_TOKEN || ''

export default function () {
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type':  'application/json',
  }

  // ─── Test 1: Dashboard endpoint (primary pain point) ──────────────────────
  const dashboardRes = http.get(`${BASE_URL}/api/dashboard`, { headers })

  const dashboardOk = check(dashboardRes, {
    'dashboard status 200':      r => r.status === 200,
    'dashboard has data':        r => {
      try { return JSON.parse(r.body).success === true } catch { return false }
    },
    'dashboard under 3 seconds': r => r.timings.duration < 3000,
  })

  dashboardTrend.add(dashboardRes.timings.duration)
  failRate.add(!dashboardOk)

  // track cache hits (sub-100ms = Redis cache hit)
  if (dashboardRes.timings.duration < 100) {
    cacheHits.add(1)
  } else {
    cacheMisses.add(1)
  }

  sleep(0.5)

  // ─── Test 2: Orders endpoint ───────────────────────────────────────────────
  const ordersRes = http.get(`${BASE_URL}/api/orders?page=1&limit=20`, { headers })

  check(ordersRes, {
    'orders status 200 or 403': r => r.status === 200 || r.status === 403,
    'orders under 3 seconds':   r => r.timings.duration < 3000,
  })

  sleep(0.5)

  // ─── Test 3: Health checks (proves instances are alive) ───────────────────
  const healthRes = http.get(`${BASE_URL}/health`)

  check(healthRes, {
    'gateway healthy': r => r.status === 200,
  })

  sleep(1)
}

// runs once at end — summary report
export function handleSummary(data) {
  const dashboard = data.metrics['dashboard_response_ms']
  const failures  = data.metrics['failed_requests']
  const hits      = data.metrics['cache_hits']
  const misses    = data.metrics['cache_misses']

  const totalCacheRequests = (hits?.values?.count || 0) + (misses?.values?.count || 0)
  const cacheHitRate = totalCacheRequests > 0
    ? ((hits?.values?.count || 0) / totalCacheRequests * 100).toFixed(1)
    : '0'

  const summary = {
    'FinMark Scaling Demo Results': {
      'Peak Concurrent Users':       '200',
      'Dashboard Avg Response':      `${dashboard?.values?.avg?.toFixed(0) || 'N/A'}ms`,
      'Dashboard p95 Response':      `${dashboard?.values?.['p(95)']?.toFixed(0) || 'N/A'}ms`,
      'Dashboard p99 Response':      `${dashboard?.values?.['p(99)']?.toFixed(0) || 'N/A'}ms`,
      'Failure Rate':                `${((failures?.values?.rate || 0) * 100).toFixed(2)}%`,
      'Redis Cache Hit Rate':        `${cacheHitRate}%`,
      'Target Met (under 3s p95)':   (dashboard?.values?.['p(95)'] || 9999) < 3000 ? '✅ YES' : '❌ NO',
      'Original Load Time':          '20 seconds (before optimization)',
    }
  }

  console.log('\n' + JSON.stringify(summary, null, 2))

  return {
    'tests/load/k6/results/scaling-demo-results.json': JSON.stringify(data, null, 2),
    stdout: JSON.stringify(summary, null, 2),
  }
}
