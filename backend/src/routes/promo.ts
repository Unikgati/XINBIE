import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validatePromo } from '../controllers/promoController';

const router = Router();

router.use(authenticate);
router.post('/validate', validatePromo);

export default router;
