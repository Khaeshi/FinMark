import Redis from 'ioredis'
import { createLogger } from '@finmark/shared'

const logger = createLogger('report-svc:cache')

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  // retryStrategy: (times) => Math.min(times * 50, 2000),
  retryStrategy: () => null,
  enableOfflineQueue: false,
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error('Redis error', err.message))

/**
 * Cache Keys
 */
export const CACHE_KEYS = {
  dashboard:        (userId: string) => `dashboard:${userId}`,
  dashboardAdmin:   () => `dashboard:admin:summary`,
  financialSummary: (clientId: string, period: string) => `financial:${clientId}:${period}`,
  orderCounts:      (clientId: string) => `orders:counts:${clientId}`,
  revenueChart:     (clientId: string) => `revenue:chart:${clientId}`,
}

/**
 * TTL Constants (seconds)
 */
export const TTL = {
  DASHBOARD:  60,        // 1 minute — realtime
  REPORTS:    300,       // 5 minutes — reports slightly stale
  FINANCIALS: 600,       // 10 minutes — financial summaries
}

/**
 * Cache Helpers
 */
export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    if (!data) return null
    return JSON.parse(data) as T
  } catch (err) {
    logger.warn('Cache get failed', { key, err })
    return null   // cache miss — fall through to DB
  }
}

export async function setCache<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch (err) {
    logger.warn('Cache set failed', { key, err })
    // non-fatal — continue without caching
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch (err) {
    logger.warn('Cache invalidation failed', { pattern, err })
  }
}

export default redis
