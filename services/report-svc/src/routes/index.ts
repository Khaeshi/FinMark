/**
 * @author Khaesey Angel Tablante
 */

import { Router } from 'express'
import {
  getDashboard, getFinancials, getAllFinancials,
  createFinancial, updateFinancial,
} from '../controllers/reportController'

const router = Router()

router.get('/dashboard', getDashboard)
router.get('/financials', getAllFinancials)
router.post('/financials', createFinancial)
router.patch('/financials/:id', updateFinancial)
router.get('/financials/:period', getFinancials)

export { router as reportRoutes }
