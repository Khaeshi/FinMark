import { Request, Response } from 'express'
import { z } from 'zod'
import { createLogger } from '@finmark/shared'
import { submitFeedback, getFeedback, resolveFeedback } from '../services/feedbackService.js'

const logger = createLogger('feedback-svc:controller')

export async function createFeedback(req: Request, res: Response) {
  try {
    const body = z.object({
      subject:  z.string().min(3).max(100),
      message:  z.string().min(10).max(2000),
      rating:   z.number().int().min(1).max(5).optional(),
    }).safeParse(req.body)

    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.errors[0].message })
    }

    const clientId = req.user!.clientId
    if (!clientId) {
      return res.status(403).json({ success: false, error: 'Only client users can submit feedback' })
    }

    const feedback = await submitFeedback({ clientId, ...body.data })
    res.status(201).json({ success: true, data: feedback })
  } catch (err) {
    logger.error('createFeedback failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to submit feedback' })
  }
}

export async function listFeedback(req: Request, res: Response) {
  try {
    const { page, limit, resolved } = req.query
    const { role, clientId } = req.user!

    // non-admins only see their own client's feedback
    const filterClientId = ['SUPERADMIN', 'ADMIN'].includes(role)
      ? (req.query.clientId as string | undefined)
      : clientId

    const result = await getFeedback({
      clientId:   filterClientId,
      isResolved: resolved === 'true' ? true : resolved === 'false' ? false : undefined,
      page:       Number(page) || 1,
      limit:      Number(limit) || 20,
    })

    res.json({ success: true, ...result })
  } catch (err) {
    logger.error('listFeedback failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to fetch feedback' })
  }
}

export async function markResolved(req: Request, res: Response) {
  try {
    const feedback = await resolveFeedback(req.params.id as string)
    res.json({ success: true, data: feedback })
  } catch (err) {
    logger.error('markResolved failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to resolve feedback' })
  }
}
