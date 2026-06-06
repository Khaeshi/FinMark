import { Request, Response } from 'express'
import { z } from 'zod'
import { createLogger } from '@finmark/shared'
import { getProducts, getProductBySku, createProduct, updateStock } from '../services/productService.js'

const logger = createLogger('product-svc:controller')

export async function listProducts(req: Request, res: Response) {
  try {
    const { page, limit, all } = req.query
    const result = await getProducts(
      Number(page) || 1,
      Number(limit) || 20,
      all !== 'true'
    )
    res.json({ success: true, ...result })
  } catch (err) {
    logger.error('listProducts failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to fetch products' })
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const product = await getProductBySku(req.params.sku as string)
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' })
    res.json({ success: true, data: product })
  } catch (err) {
    logger.error('getProduct failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to fetch product' })
  }
}

export async function createNewProduct(req: Request, res: Response) {
  try {
    const body = z.object({
      name:  z.string().min(2),
      sku:   z.string().min(2),
      price: z.string().regex(/^\d+(\.\d{1,2})?$/),
      stock: z.number().int().min(0),
    }).safeParse(req.body)

    if (!body.success) {
      return res.status(400).json({ success: false, error: body.error.errors[0].message })
    }

    const product = await createProduct(body.data)
    res.status(201).json({ success: true, data: product })
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, error: 'SKU already exists' })
    }
    logger.error('createProduct failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to create product' })
  }
}

export async function updateStockHandler(req: Request, res: Response) {
  try {
    const { delta } = z.object({ delta: z.number().int() }).parse(req.body)
    const result = await updateStock(req.params.sku as string, delta)
    if ('error' in result) {
      return res.status(400).json({ success: false, error: result.error })
    }
    res.json({ success: true, data: result })
  } catch (err) {
    logger.error('updateStock failed', err, req.requestId)
    res.status(500).json({ success: false, error: 'Failed to update stock' })
  }
}
