import { Router } from 'express';
import { shopeeSync } from '../controllers/syncController';
import { serviceAuth } from '../middleware/auth';

const router = Router();

// Endpoint for automated sync from Shopee (Apify -> n8n -> XINBIE)
router.post('/shopee', serviceAuth, shopeeSync);

export default router;
