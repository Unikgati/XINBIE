import { Router } from 'express';
import { midtransWebhook } from '../controllers/paymentController';

const router = Router();

router.post('/webhook/midtrans', midtransWebhook);

export default router;
