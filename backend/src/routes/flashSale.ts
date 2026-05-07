import { Router } from 'express';
import * as flashSaleController from '../controllers/flashSaleController';

const router = Router();

// Public routes (for user app)
router.get('/flash-sales', flashSaleController.getFlashSales);
router.get('/flash-sales/:id', flashSaleController.getFlashSaleDetail);

export default router;
