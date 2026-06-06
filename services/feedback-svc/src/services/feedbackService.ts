import { prisma } from '@finmark/db'
import { createLogger } from '@finmark/shared'

const logger = createLogger('feedback-svc:service')

export async function submitFeedback(data: {
  clientId: string
  subject:  string
  message:  string
  rating?:  number
}) {
  const feedback = await prisma.feedback.create({
    data: {
      clientId: data.clientId,
      subject:  data.subject,
      message:  data.message,
      rating:   data.rating,
    },
  })

  logger.info('Feedback submitted', { feedbackId: feedback.id, clientId: feedback.clientId })
  return feedback
}

export async function getFeedback(filters: {
  clientId?:  string
  isResolved?: boolean
  page?:      number
  limit?:     number
}) {
  const { clientId, isResolved, page = 1, limit = 20 } = filters

  const where = {
    ...(clientId   !== undefined && { clientId }),
    ...(isResolved !== undefined && { isResolved }),
  }

  const [feedbacks, total] = await Promise.all([
    prisma.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * limit,
      take:    limit,
      include: {
        client: { select: { name: true, industry: true } },
      },
    }),
    prisma.feedback.count({ where }),
  ])

  return { data: feedbacks, total, page, limit, hasMore: total > page * limit }
}

export async function resolveFeedback(feedbackId: string) {
  const feedback = await prisma.feedback.update({
    where: { id: feedbackId },
    data:  { isResolved: true },
  })

  logger.info('Feedback resolved', { feedbackId })
  return feedback
}
