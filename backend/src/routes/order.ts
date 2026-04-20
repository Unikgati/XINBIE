import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as order from '../controllers/orderController';

const router = Router();

router.use(authenticate);
router.post('/', order.createOrder);
router.get('/', order.getOrders);
router.get('/:id', order.getOrder);
router.put('/:id/cancel', order.cancelOrder);

export default router;
