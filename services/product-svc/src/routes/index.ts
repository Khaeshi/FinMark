import { Router } from 'express'
import {
  listProducts, getProduct,
  createNewProduct, updateStockHandler,
} from '../controllers/productController.js'

const router = Router()

router.get('/', listProducts)
router.get('/:sku', getProduct)
router.post('/', createNewProduct)
router.patch('/:sku/stock', updateStockHandler)

export { router as productRoutes }
