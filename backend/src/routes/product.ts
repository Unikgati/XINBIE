import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as product from '../controllers/productController';

const router = Router();

import { uploadReview } from '../middleware/upload';
import { reviewLimiter } from '../middleware/rateLimit';

router.get('/categories', product.getCategories);
router.get('/products', product.getProducts);
router.get('/products/:id', optionalAuth, product.getProduct);
router.get('/products/:id/reviews', product.getReviews);
router.post('/products/:id/reviews', reviewLimiter, uploadReview.array('images', 3), product.submitReview);
router.get('/banners', product.getBanners);
router.get('/cooking-videos', product.getCookingVideos);
router.post('/visit', product.recordVisit);
router.get('/settings/whatsapp', product.getWhatsAppSetting);

export default router;
