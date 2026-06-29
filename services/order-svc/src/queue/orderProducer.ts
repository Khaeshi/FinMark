/**
 * @author Khaesey Angel Tablante
 */

import {
  SQSClient,
  SendMessageCommand,
} from '@aws-sdk/client-sqs'
import { createLogger } from '@finmark/shared'

const logger = createLogger('order-svc:queue')

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'ap-southeast-1',
})

const ORDER_QUEUE_URL = process.env.SQS_ORDER_QUEUE_URL!

export type OrderEvent =
  | { type: 'ORDER_CREATED';   orderId: string; clientId: string; amount: string }
  | { type: 'ORDER_UPDATED';   orderId: string; status: string }
  | { type: 'ORDER_CANCELLED'; orderId: string; clientId: string; reason?: string }
  | { type: 'ORDER_FULFILLED'; orderId: string; clientId: string }

// publish an order event to SQS
// product-svc and report-svc consume these
export async function publishOrderEvent(event: OrderEvent): Promise<void> {
  try {
    const command = new SendMessageCommand({
      QueueUrl:    ORDER_QUEUE_URL,
      MessageBody: JSON.stringify(event),
      MessageAttributes: {
        eventType: {
          DataType:    'String',
          StringValue: event.type,
        },
      },
      // group by orderId for FIFO ordering
      MessageGroupId:         event.orderId,
      MessageDeduplicationId: `${event.orderId}-${event.type}-${Date.now()}`,
    })

    await sqsClient.send(command)
    logger.info('Order event published', { type: event.type, orderId: event.orderId })
  } catch (err) {
    // non-fatal for the API — log and continue
    // the order is saved to DB regardless
    logger.error('Failed to publish order event to SQS', { event, err })
  }
}
