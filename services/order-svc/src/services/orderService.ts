/**
 * @author Khaesey Angel Tablante
 */


import { prisma, Prisma} from '@finmark/db'
import { createLogger } from '@finmark/shared'
import type { OrderStatus } from '@finmark/shared'
import { publishOrderEvent } from '../queue/orderProducer'

const logger = createLogger('order-svc:service')

// valid status transitions — prevents invalid state changes
const VALID_TRANSITIONS: Record<string, OrderStatus[]> = {
  PENDING:    ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:  ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['FULFILLED', 'CANCELLED'],
  FULFILLED:  ['REFUNDED'],
  CANCELLED:  [],
  REFUNDED:   [],
}

/**
 * Get Orders
 * @param clientId 
 * @param page 
 * @param limit 
 * @param status 
 * @returns data, total, page, limit, hasMore: total
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

  return {
    data:    orders.map(o => ({ ...o, amount: o.amount.toString() })),
    total,
    page,
    limit,
    hasMore: total > page * limit,
  }
}

/**
 * Get Single Order
 * @param orderId 
 * @param clientId 
 * @returns 
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

  return { ...order, amount: order.amount.toString() }
}

/**
 * Create Order
 * @param data 
 * @returns 
 */
export async function createOrder(data: {
  clientId:    string
  amount:      string
  currency?:   string
  description?: string
  metadata?:   Record<string, unknown>
}) {
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

  logger.info('Order created', { orderId: order.id, clientId: order.clientId })
  return { ...order, amount: order.amount.toString() }
}

/**
 * Update Order Status
 * @param orderId
 * @param newStatus 
 * @param clientId 
 * @returns 
 */
export async function updateOrderStatus(
  orderId:  string,
  newStatus: OrderStatus,
  clientId?: string
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

  const updated = await prisma.order.update({
    where: { id: orderId },
    data:  { status: newStatus },
  })

  // publish status change event
  await publishOrderEvent({
    type:    newStatus === 'FULFILLED' ? 'ORDER_FULFILLED' : 'ORDER_UPDATED',
    orderId: updated.id,
    clientId: updated.clientId,
    status:  newStatus,
  })

  logger.info('Order status updated', { orderId, from: order.status, to: newStatus })
  return { ...updated, amount: updated.amount.toString() }
}

/**
 * Cancel Order
 * @param orderId 
 * @param clientId 
 * @param reason 
 * @returns 
 */
export async function cancelOrder(orderId: string, clientId?: string, reason?: string) {
  const result = await updateOrderStatus(orderId, 'CANCELLED', clientId)
  if ('error' in result) return result

  await publishOrderEvent({
    type:     'ORDER_CANCELLED',
    orderId,
    clientId: result.clientId,
    reason,
  })

  return result
}
