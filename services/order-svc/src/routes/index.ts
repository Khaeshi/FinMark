import { Router } from 'express'
import {
  listOrders, getOrder,
  createNewOrder, updateStatus, cancelOrderHandler,
} from '../controllers/orderController.js'

const router = Router()

router.get('/', listOrders)
router.get('/:id',getOrder)
router.post('/', createNewOrder)
router.patch('/:id/status', updateStatus)
router.delete('/:id', cancelOrderHandler)

export { router as orderRoutes }
