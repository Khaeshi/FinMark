/**
 * @author Khaesey Angel Tablante
 */

import { Router } from 'express'
import { getDashboard, getFinancials, getAllFinancials } from '../controllers/reportController'

const router = Router()

router.get('/dashboard', getDashboard)
router.get('/financials', getAllFinancials) 
router.get('/financials/:period', getFinancials)


export { router as reportRoutes }
