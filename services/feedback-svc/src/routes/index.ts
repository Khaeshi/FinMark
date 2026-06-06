import { Router } from 'express'
import { createFeedback, listFeedback, markResolved } from '../controllers/feedbackController.js'

const router = Router()

router.get('/', listFeedback)
router.post('/', createFeedback)
router.patch('/:id/resolve', markResolved)

export { router as feedbackRoutes }
