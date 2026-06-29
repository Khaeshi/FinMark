/**
 * @author Khaesey Angel Tablante
 */


import { prisma } from '@finmark/db'
import { createLogger } from '@finmark/shared'

const logger = createLogger('product-svc:service')

/**
 *  Product CRUD
 * @param page 
 * @param limit 
 * @param activeOnly 
 * @returns 
 */

export async function getProducts(page = 1, limit = 20, activeOnly = true) {
  const where = activeOnly ? { isActive: true } : {}

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
    }),
    prisma.product.count({ where }),
  ])

  return {
    data:    products.map(p => ({ ...p, price: p.price.toString() })),
    total,
    page,
    limit,
    hasMore: total > page * limit,
  }
}

export async function getProductBySku(sku: string) {
  const product = await prisma.product.findUnique({ where: { sku } })
  if (!product) return null
  return { ...product, price: product.price.toString() }
}

export async function createProduct(data: {
  name:  string
  sku:   string
  price: string
  stock: number
}) {
  const product = await prisma.product.create({
    data: {
      name:  data.name,
      sku:   data.sku,
      price: data.price,
      stock: data.stock,
    },
  })

  logger.info('Product created', { productId: product.id, sku: product.sku })
  return { ...product, price: product.price.toString() }
}

export async function updateStock(sku: string, delta: number) {
  // use atomic increment to prevent race conditions
  const product = await prisma.product.update({
    where: { sku },
    data:  { stock: { increment: delta } },
  })

  if (product.stock < 0) {
    // rollback if stock goes negative
    await prisma.product.update({
      where: { sku },
      data:  { stock: { decrement: delta } },
    })
    return { error: 'Insufficient stock' }
  }

  logger.info('Stock updated', { sku, delta, newStock: product.stock })
  return { ...product, price: product.price.toString() }
}

/**
 * SQS Order Event Handler
 * @desc called by the SQS consumer when order-svc publishes events
 * @param event 
 */

export async function handleOrderEvent(event: {
  type:     string
  orderId:  string
  clientId?: string
  amount?:  string
  status?:  string
}) {
  switch (event.type) {
    case 'ORDER_CREATED':
      // placeholder — in real system would check inventory
      logger.info('Order created event received', { orderId: event.orderId })
      break

    case 'ORDER_CANCELLED':
      // placeholder — in real system would release reserved stock
      logger.info('Order cancelled event received', { orderId: event.orderId })
      break

    case 'ORDER_FULFILLED':
      // placeholder — in real system would finalize stock deduction
      logger.info('Order fulfilled event received', { orderId: event.orderId })
      break

    default:
      logger.warn('Unknown order event type', { type: event.type })
  }
}
