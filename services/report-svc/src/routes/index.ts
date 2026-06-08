import { Router } from 'express'
import { getDashboard, getFinancials } from '../controllers/reportController'

const router = Router()

router.get('/dashboard', getDashboard)
router.get('/financials/:period', getFinancials)

export { router as reportRoutes }
