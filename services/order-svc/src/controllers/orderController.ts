import { Request, Response } from 'express'
import { z } from 'zod'
import { createLogger } from '@finmark/shared'
import type { OrderStatus } from '@finmark/shared'
import {
  getOrders, getOrderById,
  createOrder, updateOrderStatus, cancelOrder,
} from '../services/orderService.js'

const logger = createLogger('order-svc:controller')

const CreateOrderSchema = z.object({
  clientId:    z.string().min(1),
  amount:      z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format'),
  currency:    z.string().length(3).optional(),
  description: z.string().max(255).optional(),
  metadata:    z.record(z.unknown()).optional(),
})

const UpdateStatusSchema = z.object({
  status: z.enum(['PENDING','CONFIRMED','PROCESSING','FULFILLED','CANCELLED','REFUNDED']),
})

// GET /orders
export async function listOrders(req: Request, res: Response) {
  try {
    const { page, limit, status } = req.query
    const { role, clientId } = req.user!

    // non-admin users can only see their own client's orders
    const filterClientId = ['SUPERADMIN', 'ADMIN'].includes(role)
      ? (req.query.clientId as string | undefined)
      : clientId

    const result = await getOrders(
      filterClientId,
      Number(page) || 1,
      Number(limit) || 20,
      status as OrderStatus | undefined
    )

    res.json({ success: true, ...result })
  } catch (err) {
    logger.error('listOrders failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to fetch orders' })
  }
}

// GET /orders/:id
export async function getOrder(req: Request, res: Response) {
  try {
    const { role, clientId } = req.user!
    const filterClientId = ['SUPERADMIN', 'ADMIN'].includes(role) ? undefined : clientId

    const orderId = req.params.id as string 
    const order = await getOrderById(orderId, filterClientId)
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' })

    res.json({ success: true, data: order })
  } catch (err) {
    logger.error('getOrder failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to fetch order' })
  }
}

// POST /orders
export async function createNewOrder(req: Request, res: Response) {
  try {
    const body = CreateOrderSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.errors[0].message })
    }

    const order = await createOrder(body.data as { 
      clientId: string; 
      amount: string; 
      currency: string; 
      description: string; 
      metadata: Record<string, unknown>; })
    res.status(201).json({ success: true, data: order })
  } catch (err) {
    logger.error('createOrder failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to create order' })
  }
}

// PATCH /orders/:id/status
export async function updateStatus(req: Request, res: Response) {
  try {
    const body = UpdateStatusSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: 'Invalid status value' })
    }

    const { role, clientId } = req.user!
    const filterClientId = ['SUPERADMIN', 'ADMIN'].includes(role) ? undefined : clientId

    const orderId = req.params.id as string 
    const result = await updateOrderStatus(orderId, body.data.status, filterClientId)
    if ('error' in result) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({ success: true, data: result })
  } catch (err) {
    logger.error('updateStatus failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to update order status' })
  }
}

// DELETE /orders/:id  (cancel)
export async function cancelOrderHandler(req: Request, res: Response) {
  try {
    const { role, clientId } = req.user!
    const filterClientId = ['SUPERADMIN', 'ADMIN'].includes(role) ? undefined : clientId
    const { reason } = req.body

    const orderId = req.params.id as string 
    const result = await cancelOrder(orderId, filterClientId, reason)
    if ('error' in result) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.json({ success: true, data: result })
  } catch (err) {
    logger.error('cancelOrder failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to cancel order' })
  }
}
