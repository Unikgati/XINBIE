import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as product from '../controllers/productController';

const router = Router();

router.get('/categories', product.getCategories);
router.get('/products', product.getProducts);
router.get('/products/:id', product.getProduct);
router.get('/banners', product.getBanners);
router.post('/cart/validate', authenticate, product.validateCart);

export default router;
