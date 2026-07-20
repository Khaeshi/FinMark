/**
 * @author Khaesey Angel Tablante
 */

import { Router } from 'express'
import {
  listOrders, getOrder, listOrderAuditLog,
  createNewOrder, updateStatus, cancelOrderHandler,
} from '../controllers/orderController'

const router = Router()

router.get('/', listOrders)
router.get('/:id/audit-log', listOrderAuditLog)
router.get('/:id', getOrder)
router.post('/', createNewOrder)
router.patch('/:id/status', updateStatus)
router.delete('/:id', cancelOrderHandler)

export { router as orderRoutes }
