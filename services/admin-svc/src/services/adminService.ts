import { prisma } from '@finmark/db'
import { createLogger } from '@finmark/shared'
import type { UserRole } from '@finmark/shared'
import {
  getAdminCache, setAdminCache,
  invalidateAdminCache,
  ADMIN_CACHE_KEYS, ADMIN_TTL,
} from '../cache/redisClient.js'

const logger = createLogger('admin-svc:service')

/**
 * Users
 * @param page 
 * @param limit 
 * @returns result
 */

export async function getAllUsers(page = 1, limit = 50) {
  const cacheKey = ADMIN_CACHE_KEYS.allUsers()
  const cached = await getAdminCache(cacheKey)
  if (cached) return cached

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      select: {
        id:          true,
        email:       true,
        name:        true,
        role:        true,
        isActive:    true,
        lastLoginAt: true,
        createdAt:   true,
        clientId:    true,
        client: { select: { name: true } },
      },
    }),
    prisma.user.count(),
  ])

  const result = { data: users, total, page, limit, hasMore: total > page * limit }
  await setAdminCache(cacheKey, result, ADMIN_TTL.USERS)
  return result
}

export async function getUserById(userId: string) {
  const cacheKey = ADMIN_CACHE_KEYS.userById(userId)
  const cached = await getAdminCache(cacheKey)
  if (cached) return cached

  const user = await prisma.user.findUnique({
    where:   { id: userId },
    include: { client: { select: { id: true, name: true, industry: true } } },
  })

  if (user) await setAdminCache(cacheKey, user, ADMIN_TTL.USERS)
  return user
}

export async function updateUserRole(userId: string, newRole: UserRole) {
  const user = await prisma.user.update({
    where: { id: userId },
    data:  { role: newRole },
  })

  // invalidate user caches — role change must propagate immediately
  await invalidateAdminCache('admin:user*')
  await invalidateAdminCache('admin:users*')

  logger.info('User role updated', { userId, newRole })
  return user
}

export async function toggleUserActive(userId: string, isActive: boolean) {
  const user = await prisma.user.update({
    where: { id: userId },
    data:  { isActive },
  })

  await invalidateAdminCache(`admin:user:${userId}`)
  await invalidateAdminCache('admin:users:all')

  logger.info('User active status updated', { userId, isActive })
  return user
}

export async function assignUserToClient(userId: string, clientId: string) {
  const [user, client] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.sMEClient.findUnique({ where: { id: clientId } }),
  ])

  if (!user)   return { error: 'User not found' }
  if (!client) return { error: 'Client not found' }

  const updated = await prisma.user.update({
    where: { id: userId },
    data:  { clientId },
  })

  await invalidateAdminCache('admin:user*')
  await invalidateAdminCache('admin:users*')

  logger.info('User assigned to client', { userId, clientId })
  return updated
}

/**
 * SME Clients
 * @param page 
 * @param limit 
 * @returns result = { data: clients, total, page, limit, hasMore: total > page * limit }
 */

export async function getAllClients(page = 1, limit = 50) {
  const cacheKey = ADMIN_CACHE_KEYS.allClients()
  const cached = await getAdminCache(cacheKey)
  if (cached) return cached

  const [clients, total] = await Promise.all([
    prisma.sMEClient.findMany({
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        _count: {
          select: { users: true, orders: true },
        },
      },
    }),
    prisma.sMEClient.count(),
  ])

  const result = { data: clients, total, page, limit, hasMore: total > page * limit }
  await setAdminCache(cacheKey, result, ADMIN_TTL.CLIENTS)
  return result
}

export async function createClient(data: {
  name:             string
  industry:         string
  country?:         string
  subscriptionTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'
}) {
  const client = await prisma.sMEClient.create({
    data: {
      name:             data.name,
      industry:         data.industry,
      country:          data.country || 'PH',
      subscriptionTier: data.subscriptionTier || 'FREE',
    },
  })

  await invalidateAdminCache('admin:clients*')
  logger.info('SME client created', { clientId: client.id, name: client.name })
  return client
}

export async function updateClient(clientId: string, data: {
  name?:             string
  industry?:         string
  isActive?:         boolean
  subscriptionTier?: 'FREE' | 'STARTER' | 'GROWTH' | 'ENTERPRISE'
}) {
  const client = await prisma.sMEClient.update({
    where: { id: clientId },
    data,
  })

  await invalidateAdminCache(`admin:client:${clientId}`)
  await invalidateAdminCache('admin:clients:all')

  logger.info('SME client updated', { clientId })
  return client
}

/**
 * Audit Logs
 * @param filters 
 * @returns 
 */

export async function getAuditLogs(filters: {
  userId?:   string
  action?:   string
  page?:     number
  limit?:    number
}) {
  const { userId, action, page = 1, limit = 50 } = filters

  const where = {
    ...(userId && { userId }),
    ...(action && { action: { contains: action } }),
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.auditLog.count({ where }),
  ])

  return { data: logs, total, page, limit, hasMore: total > page * limit }
}
