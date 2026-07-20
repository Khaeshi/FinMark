/**
 * @author Khaesey Angel Tablante
 */

import { Request, Response } from 'express'
import { z } from 'zod'
import {
  getDashboardData, getFinancialSummary, getAllFinancialRecords,
  createFinancialRecord, updateFinancialRecord,
} from '../services/reportService'
import { createLogger, subtractAmounts, isValidAmount } from '@finmark/shared'

const logger = createLogger('report-svc:controller')

const CreateFinancialSchema = z.object({
  clientId:   z.string().min(1),
  period:     z.string().regex(/^\d{4}-Q[1-4]$/, 'Period must be YYYY-Q[1-4]'),
  revenue:    z.string().refine(isValidAmount, 'Invalid revenue format'),
  expenses:   z.string().refine(isValidAmount, 'Invalid expenses format'),
  orderCount: z.number().int().nonnegative(),
})

const UpdateFinancialSchema = z.object({
  revenue:    z.string().refine(isValidAmount, 'Invalid revenue format').optional(),
  expenses:   z.string().refine(isValidAmount, 'Invalid expenses format').optional(),
  orderCount: z.number().int().nonnegative().optional(),
})

export async function getDashboard(req: Request, res: Response) {
  try {
    const { sub: userId, clientId, role } = req.user!
    const data = await getDashboardData(userId, clientId, role)
    res.json({ success: true, data })
  } catch (err: any) {
    console.error('FULL DASHBOARD ERROR:', err)   // ← add this
    logger.error('getDashboard failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to load dashboard', detail: err.message })
  }
}

export async function getFinancials(req: Request, res: Response) {
  try {
    const { clientId } = req.user!
    const { period } = req.params

    if (!clientId) {
      return res.status(400).json({ success: false, error: 'clientId required' })
    }

    const data = await getFinancialSummary(clientId, period)
    if (!data) {
      return res.status(404).json({ success: false, error: 'Financial record not found' })
    }

    res.json({ success: true, data })
  } catch (err) {
    logger.error('getFinancials failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to load financials' })
  }
}

/**
 * @author Khaesey Angel Tablante
 * @description Get all financial records for all clients
 * @wired to /reports-svc/src/routes/index.ts
 */
export async function getAllFinancials(req: Request, res: Response) {
  try {
    const { role, clientId } = req.user!
    const filterClientId = ['SUPERADMIN', 'ADMIN'].includes(role)
      ? undefined
      : clientId

    const data = await getAllFinancialRecords(filterClientId)
    res.json({ success: true, data })
  } catch (err) {
    logger.error('getAllFinancials failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to load financial records' })
  }
}

// POST /financials
export async function createFinancial(req: Request, res: Response) {
  try {
    const body = CreateFinancialSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.errors[0].message })
    }

    const { revenue, expenses } = body.data
    if (parseFloat(revenue) < 0 || parseFloat(expenses) < 0) {
      return res.status(400).json({ success: false, error: 'Revenue and expenses must be non-negative' })
    }

    const netProfit = subtractAmounts(revenue, expenses)
    const result = await createFinancialRecord({
      clientId:   body.data.clientId,
      period:     body.data.period,
      revenue:    body.data.revenue,
      expenses:   body.data.expenses,
      orderCount: body.data.orderCount,
      netProfit,
    })

    if ('error' in result) {
      return res.status(400).json({ success: false, error: result.error })
    }

    res.status(201).json({ success: true, data: result })
  } catch (err) {
    logger.error('createFinancial failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to create financial record' })
  }
}

// PATCH /financials/:id
export async function updateFinancial(req: Request, res: Response) {
  try {
    const body = UpdateFinancialSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.errors[0].message })
    }

    const { revenue, expenses, orderCount } = body.data

    const result = await updateFinancialRecord(req.params.id as string, {
      ...(revenue    !== undefined && { revenue }),
      ...(expenses   !== undefined && { expenses }),
      ...(orderCount !== undefined && { orderCount }),
    })
    if ('error' in result) {
      return res.status(404).json({ success: false, error: result.error })
    }

    res.json({ success: true, data: result })
  } catch (err) {
    logger.error('updateFinancial failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to update financial record' })
  }
}