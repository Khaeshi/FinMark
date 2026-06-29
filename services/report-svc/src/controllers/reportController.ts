/**
 * @author Khaesey Angel Tablante
 */

import { Request, Response } from 'express'
import { getDashboardData, getFinancialSummary } from '../services/reportService'
import { createLogger } from '@finmark/shared'

const logger = createLogger('report-svc:controller')

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
