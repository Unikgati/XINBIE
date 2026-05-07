import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { validatePromo, getAvailablePromos } from '../controllers/promoController';

const router = Router();

router.get('/available', optionalAuth, getAvailablePromos);

router.use(authenticate);
router.post('/validate', validatePromo);

export default router;
