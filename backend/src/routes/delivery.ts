import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as delivery from '../controllers/deliveryController';

const router = Router();

router.get('/delivery/slots', delivery.getSlots);
router.get('/delivery/options', delivery.getOptions);
router.post('/promo/validate', authenticate, delivery.validatePromo);

export default router;
