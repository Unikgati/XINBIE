import { Router } from 'express';
import * as region from '../controllers/regionController';

const router = Router();

router.get('/provinces', region.getProvinces);
router.get('/cities', region.getCities);
router.get('/districts', region.getDistricts);
router.get('/villages', region.getVillages);

export default router;
