import { Request, Response } from 'express'
import { z } from 'zod'
import { createLogger } from '@finmark/shared'
import {
  getAllUsers, getUserById, updateUserRole,
  toggleUserActive, assignUserToClient,
  getAllClients, createClient, updateClient,
  getAuditLogs,
} from '../services/adminService'

const logger = createLogger('admin-svc:controller')

// ─── Users ────────────────────────────────────────────────────────────────────

export async function listUsers(req: Request, res: Response) {
  try {
    const { page, limit } = req.query
    const result = await getAllUsers(Number(page) || 1, Number(limit) || 50)
    res.json({ success: true, ...result })
  } catch (err) {
    logger.error('listUsers failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to fetch users' })
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const user = await getUserById(req.params.id as string)
    if (!user) return res.status(404).json({ success: false, error: 'User not found' })
    res.json({ success: true, data: user })
  } catch (err) {
    logger.error('getUser failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to fetch user' })
  }
}

export async function changeUserRole(req: Request, res: Response) {
  try {
    const body = z.object({
      role: z.enum(['SUPERADMIN', 'ADMIN', 'FINANCE', 'OPERATIONS', 'ANALYST', 'VIEWER']),
    }).safeParse(req.body)

    if (!body.success) {
      return res.status(400).json({ success: false, error: 'Invalid role' })
    }

    const user = await updateUserRole(req.params.id as string, body.data.role)
    res.json({ success: true, data: user })
  } catch (err) {
    logger.error('changeUserRole failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to update role' })
  }
}

export async function setUserActive(req: Request, res: Response) {
  try {
    const { isActive } = z.object({ isActive: z.boolean() }).parse(req.body)
    const user = await toggleUserActive(req.params.id as string, isActive)
    res.json({ success: true, data: user })
  } catch (err) {
    logger.error('setUserActive failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to update user status' })
  }
}

export async function assignToClient(req: Request, res: Response) {
  try {
    const { clientId } = z.object({ clientId: z.string() }).parse(req.body)
    const result = await assignUserToClient(req.params.id as string, clientId)
    if ('error' in result) {
      return res.status(400).json({ success: false, error: result.error })
    }
    res.json({ success: true, data: result })
  } catch (err) {
    logger.error('assignToClient failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to assign user to client' })
  }
}

// ─── Clients ──────────────────────────────────────────────────────────────────

export async function listClients(req: Request, res: Response) {
  try {
    const { page, limit } = req.query
    const result = await getAllClients(Number(page) || 1, Number(limit) || 50)
    res.json({ success: true, ...result })
  } catch (err) {
    logger.error('listClients failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to fetch clients' })
  }
}

export async function createNewClient(req: Request, res: Response) {
  try {
    const body = z.object({
      name:             z.string().min(2),
      industry:         z.string().min(2),
      country:          z.string().length(2).optional(),
      subscriptionTier: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
    }).safeParse(req.body)

    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.errors[0].message })
    }

    const client = await createClient(body.data as { 
      name: string; 
      industry: string; 
      country: string; 
      subscriptionTier: "FREE" | "STARTER" | "GROWTH" | "ENTERPRISE"; })
    res.status(201).json({ success: true, data: client })
  } catch (err) {
    logger.error('createNewClient failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to create client' })
  }
}

export async function updateClientHandler(req: Request, res: Response) {
  try {
    const body = z.object({
      name:             z.string().optional(),
      industry:         z.string().optional(),
      isActive:         z.boolean().optional(),
      subscriptionTier: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']).optional(),
    }).safeParse(req.body)

    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.errors[0].message })
    }

    const client = await updateClient(req.params.id as string, body.data)
    res.json({ success: true, data: client })
  } catch (err) {
    logger.error('updateClient failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to update client' })
  }
}

/**
 * Audit Logs
 * @param req 
 * @param res 
 */

export async function listAuditLogs(req: Request, res: Response) {
  try {
    const { userId, action, page, limit } = req.query
    const result = await getAuditLogs({
      userId:  userId as string,
      action:  action as string,
      page:    Number(page) || 1,
      limit:   Number(limit) || 50,
    })
    res.json({ success: true, ...result })
  } catch (err) {
    logger.error('listAuditLogs failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to fetch audit logs' })
  }
}
