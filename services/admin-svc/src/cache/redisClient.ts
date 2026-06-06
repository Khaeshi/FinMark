import Redis from 'ioredis'
import { createLogger } from '@finmark/shared'

const logger = createLogger('admin-svc:cache')

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableOfflineQueue: false,
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error',   (err) => logger.error('Redis error', err.message))

export const ADMIN_CACHE_KEYS = {
  allUsers:      () => 'admin:users:all',
  userById:      (id: string) => `admin:user:${id}`,
  allClients:    () => 'admin:clients:all',
  clientById:    (id: string) => `admin:client:${id}`,
  usersByClient: (clientId: string) => `admin:users:client:${clientId}`,
}

export const ADMIN_TTL = {
  USERS:   120,   // 2 minutes — role changes need to propagate quickly
  CLIENTS: 300,   // 5 minutes — client data changes less often
}

export async function getAdminCache<T>(key: string): Promise<T | null> {
  try {
    const data = await redis.get(key)
    return data ? JSON.parse(data) as T : null
  } catch {
    return null
  }
}

export async function setAdminCache<T>(key: string, value: T, ttl: number): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(value))
  } catch (err) {
    logger.warn('Cache set failed', { key })
  }
}

export async function invalidateAdminCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern)
    if (keys.length > 0) await redis.del(...keys)
  } catch (err) {
    logger.warn('Cache invalidation failed', { pattern })
  }
}

export default redis
