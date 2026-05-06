import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validatePromo, getAvailablePromos } from '../controllers/promoController';

const router = Router();

router.use(authenticate);
router.post('/validate', validatePromo);
router.get('/available', getAvailablePromos);

export default router;
