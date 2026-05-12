import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import * as product from '../controllers/productController';

const router = Router();

router.get('/categories', product.getCategories);
router.get('/products', product.getProducts);
router.get('/products/:id', optionalAuth, product.getProduct);
router.get('/banners', product.getBanners);
router.get('/cooking-videos', product.getCookingVideos);
router.post('/cart/validate', authenticate, product.validateCart);

export default router;
