/**
 * @author Khaesey Angel Tablante
 */


import { prisma, Prisma} from '@finmark/db'
import { createLogger } from '@finmark/shared'
import type { OrderStatus } from '@finmark/shared'
import { publishOrderEvent } from '../queue/orderProducer'

const logger = createLogger('order-svc:service')

const ANOMALY_MULTIPLIER = 3
const MIN_ORDERS_FOR_ANOMALY = 3

// valid status transitions — prevents invalid state changes
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['FULFILLED', 'CANCELLED'],
  FULFILLED:  ['REFUNDED'],
  CANCELLED:  [],
  REFUNDED:   [],
}

/** Resolve gateway x-user-id (Cognito sub) → DB User.id for AuditLog.userId */
async function resolveDbUserId(cognitoOrDbId?: string): Promise<string> {
  if (!cognitoOrDbId) return 'unknown'
  const byId = await prisma.user.findUnique({ where: { id: cognitoOrDbId }, select: { id: true } })
  if (byId) return byId.id
  const byCognito = await prisma.user.findUnique({
    where: { cognitoId: cognitoOrDbId },
    select: { id: true },
  })
  return byCognito?.id ?? cognitoOrDbId
}

async function writeAuditLog(params: {
  userId: string
  action: string
  resourceId: string
  metadata?: Record<string, unknown>
}) {
  try {
    await prisma.auditLog.create({
      data: {
        userId:     params.userId,
        action:     params.action,
        resource:   'orders',
        resourceId: params.resourceId,
        metadata:   (params.metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
      },
    })
  } catch (err) {
    // Non-fatal for the primary order mutation — still log for debugging
    logger.warn('Audit log write failed', {
      action: params.action,
      resourceId: params.resourceId,
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

function evaluateAnomaly(
  amount: string,
  avgAmount: number | null | undefined,
  priorCount: number
): { flagged: boolean; flagReason: string | null; average: string | null; multiplier: number | null } {
  if (priorCount < MIN_ORDERS_FOR_ANOMALY || !avgAmount || avgAmount <= 0) {
    return { flagged: false, flagReason: null, average: null, multiplier: null }
  }
  const amountNum = parseFloat(amount)
  const multiplier = amountNum / avgAmount
  if (multiplier > ANOMALY_MULTIPLIER) {
    return {
      flagged: true,
      flagReason: `Amount is ${multiplier.toFixed(1)}x this client's average order`,
      average: avgAmount.toFixed(2),
      multiplier: Number(multiplier.toFixed(2)),
    }
  }
  return { flagged: false, flagReason: null, average: avgAmount.toFixed(2), multiplier: Number(multiplier.toFixed(2)) }
}

/**
 * Get Orders
 */
export async function getOrders(
  clientId: string | undefined,
  page = 1,
  limit = 20,
  status?: OrderStatus
) {
  const where = {
    ...(clientId && { clientId }),
    ...(status   && { status }),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
      select: {
        id:          true,
        clientId:    true,
        status:      true,
        amount:      true,
        currency:    true,
        description: true,
        createdAt:   true,
        updatedAt:   true,
        client: {
          select: { name: true, industry: true },
        },
      },
    }),
    prisma.order.count({ where }),
  ])

  // Compute anomaly flags fresh (not persisted) for rows on this page
  const clientIds = [...new Set(orders.map(o => o.clientId))]
  const stats = clientIds.length > 0
    ? await prisma.order.groupBy({
        by: ['clientId'],
        where: { clientId: { in: clientIds } },
        _avg: { amount: true },
        _count: { id: true },
      })
    : []

  const statsByClient = new Map(
    stats.map(s => [s.clientId, { avg: s._avg.amount ? Number(s._avg.amount) : null, count: s._count.id }])
  )

  return {
    data: orders.map(o => {
      const s = statsByClient.get(o.clientId)
      const amountStr = o.amount.toString()
      const anomaly = evaluateAnomaly(amountStr, s?.avg, s?.count ?? 0)
      return {
        ...o,
        amount: amountStr,
        flagged: anomaly.flagged,
        flagReason: anomaly.flagReason,
      }
    }),
    total,
    page,
    limit,
    hasMore: total > page * limit,
  }
}

/**
 * Get Single Order
 */
export async function getOrderById(orderId: string, clientId?: string) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(clientId && { clientId }),
    },
    include: {
      client: { select: { name: true, industry: true, country: true } },
    },
  })

  if (!order) return null

  const stats = await prisma.order.aggregate({
    where: { clientId: order.clientId },
    _avg: { amount: true },
    _count: { id: true },
  })

  const amountStr = order.amount.toString()
  const anomaly = evaluateAnomaly(
    amountStr,
    stats._avg.amount ? Number(stats._avg.amount) : null,
    stats._count.id
  )

  return {
    ...order,
    amount: amountStr,
    flagged: anomaly.flagged,
    flagReason: anomaly.flagReason,
  }
}

/**
 * Create Order
 * @param actorUserId optional Cognito sub / user id from gateway headers (threaded by controller)
 */
export async function createOrder(data: {
  clientId:    string
  amount:      string
  currency?:   string
  description?: string
  metadata?:   Record<string, unknown>
}, actorUserId?: string) {
  const priorStats = await prisma.order.aggregate({
    where: { clientId: data.clientId },
    _avg: { amount: true },
    _count: { id: true },
  })

  const anomaly = evaluateAnomaly(
    data.amount,
    priorStats._avg.amount ? Number(priorStats._avg.amount) : null,
    priorStats._count.id
  )

  const order = await prisma.order.create({
    data: {
      clientId:    data.clientId,
      amount:      data.amount,
      currency:    data.currency || 'PHP',
      description: data.description,
      metadata: (data.metadata ?? Prisma.DbNull) as Prisma.InputJsonValue,
    },
  })

  // publish to SQS — product-svc will handle stock updates
  await publishOrderEvent({
    type:     'ORDER_CREATED',
    orderId:  order.id,
    clientId: order.clientId,
    amount:   order.amount.toString(),
  })

  if (anomaly.flagged) {
    const dbUserId = await resolveDbUserId(actorUserId)
    await writeAuditLog({
      userId: dbUserId,
      action: 'ORDER_FLAGGED_ANOMALY',
      resourceId: order.id,
      metadata: {
        amount: data.amount,
        average: anomaly.average,
        multiplier: anomaly.multiplier,
      },
    })
  }

  logger.info('Order created', {
    orderId: order.id,
    clientId: order.clientId,
    flagged: anomaly.flagged,
  })

  return {
    ...order,
    amount: order.amount.toString(),
    flagged: anomaly.flagged,
    flagReason: anomaly.flagReason,
  }
}

/**
 * Update Order Status
 * @param actorUserId optional — threaded from controller; does not change existing call sites that omit it
 */
export async function updateOrderStatus(
  orderId:  string,
  newStatus: OrderStatus,
  clientId?: string,
  actorUserId?: string
) {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(clientId && { clientId }),
    },
  })

  if (!order) return { error: 'Order not found' }

  // enforce valid state transitions
  const validNext = VALID_TRANSITIONS[order.status] || []
  if (!validNext.includes(newStatus)) {
    return {
      error: `Cannot transition order from ${order.status} to ${newStatus}`,
    }
  }

  const fromStatus = order.status

  const updated = await prisma.order.update({
    where: { id: orderId },
    data:  { status: newStatus },
  })

  const dbUserId = await resolveDbUserId(actorUserId)
  await writeAuditLog({
    userId: dbUserId,
    action: 'ORDER_STATUS_CHANGED',
    resourceId: orderId,
    metadata: { from: fromStatus, to: newStatus },
  })

  // publish status change event
  await publishOrderEvent({
    type:    newStatus === 'FULFILLED' ? 'ORDER_FULFILLED' : 'ORDER_UPDATED',
    orderId: updated.id,
    clientId: updated.clientId,
    status:  newStatus,
  })

  logger.info('Order status updated', { orderId, from: fromStatus, to: newStatus })
  return { ...updated, amount: updated.amount.toString() }
}

/**
 * Cancel Order
 */
export async function cancelOrder(
  orderId: string,
  clientId?: string,
  reason?: string,
  actorUserId?: string
) {
  const result = await updateOrderStatus(orderId, 'CANCELLED', clientId, actorUserId)
  if ('error' in result) return result

  await publishOrderEvent({
    type:     'ORDER_CANCELLED',
    orderId,
    clientId: result.clientId,
    reason,
  })

  return result
}

/**
 * Audit trail for a single order — used by GET /orders/:id/audit-log
 */
export async function getOrderAuditLog(orderId: string, clientId?: string) {
  // Scope check: order must exist (and belong to client when non-admin)
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      ...(clientId && { clientId }),
    },
    select: { id: true },
  })
  if (!order) return { error: 'Order not found' as const }

  const logs = await prisma.auditLog.findMany({
    where: {
      resource: 'orders',
      resourceId: orderId,
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const userIds = [...new Set(logs.map(l => l.userId).filter(id => id && id !== 'unknown'))]
  const users = userIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true, email: true },
      })
    : []
  const userMap = new Map(users.map(u => [u.id, u]))

  return {
    data: logs.map(log => ({
      id:         log.id,
      action:     log.action,
      userId:     log.userId,
      userName:   userMap.get(log.userId)?.name
        ?? (log.userId === 'unknown' ? 'System' : log.userId.slice(0, 8)),
      userEmail:  userMap.get(log.userId)?.email ?? null,
      metadata:   log.metadata as Record<string, unknown> | null,
      createdAt:  log.createdAt,
    })),
  }
}
