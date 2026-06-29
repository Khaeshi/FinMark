/**
 * @author Khaesey Angel Tablante
 */


import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  Message
} from '@aws-sdk/client-sqs'
import { createLogger } from '@finmark/shared'
import { handleOrderEvent } from '../services/productService'

const logger = createLogger('product-svc:consumer')

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
})

const ORDER_QUEUE_URL = process.env.SQS_ORDER_QUEUE_URL!
let isRunning = false

// long-poll SQS for order events
export async function startConsumer() {
  if (!ORDER_QUEUE_URL) {
    logger.warn('SQS_ORDER_QUEUE_URL not set — consumer disabled in dev mode')
    return
  }

  isRunning = true
  logger.info('SQS consumer started — listening for order events')

  while (isRunning) {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl:            ORDER_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds:     20,   // long polling — reduces empty responses
        MessageAttributeNames: ['All'],
      })

      const response = await sqsClient.send(command)

      if (!response.Messages || response.Messages.length === 0) continue

      // process messages in parallel
      await Promise.allSettled(
        response.Messages.map(async (message: Message) => {
          try {
            const event = JSON.parse(message.Body || '{}')
            await handleOrderEvent(event)

            // delete from queue only after successful processing
            await sqsClient.send(new DeleteMessageCommand({
              QueueUrl:      ORDER_QUEUE_URL,
              ReceiptHandle: message.ReceiptHandle!,
            }))

            logger.info('Order event processed', { type: event.type, orderId: event.orderId })
          } catch (err) {
            // don't delete — message returns to queue for retry
            logger.error('Failed to process order event', { err, body: message.Body })
          }
        })
      )
    } catch (err) {
      logger.error('SQS receive error', err)
      // back off before retrying
      await new Promise(r => setTimeout(r, 5000))
    }
  }
}

export function stopConsumer() {
  isRunning = false
  logger.info('SQS consumer stopped')
}
