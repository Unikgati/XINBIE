import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as address from '../controllers/addressController';

const router = Router();

router.use(authenticate);
router.get('/', address.getAddresses);
router.post('/', address.createAddress);
router.put('/:id', address.updateAddress);
router.delete('/:id', address.deleteAddress);
router.put('/:id/set-primary', address.setPrimaryAddress);

export default router;
