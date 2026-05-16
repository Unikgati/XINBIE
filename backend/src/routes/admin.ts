import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as admin from '../controllers/adminController';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

// Dashboard
router.get('/dashboard', admin.getDashboard);
router.get('/analytics', admin.getDetailedAnalytics);
router.get('/unread-counts', admin.getUnreadCounts);

// Products
router.get('/products', admin.adminGetProducts);
router.post('/products', upload.any(), admin.adminCreateProduct);
router.put('/products/:id', upload.any(), admin.adminUpdateProduct);
router.delete('/products/:id', admin.adminDeleteProduct);

// Categories
router.get('/categories', admin.adminGetCategories);
router.post('/categories', upload.single('image'), admin.adminCreateCategory);
router.put('/categories/reorder', admin.adminReorderCategories);
router.put('/categories/:id', upload.single('image'), admin.adminUpdateCategory);
router.delete('/categories/:id', admin.adminDeleteCategory);

// Product Variants
router.get('/products/:productId/variants', admin.adminGetVariants);
router.post('/products/:productId/variants', upload.single('image'), admin.adminCreateVariant);
router.put('/variants/:id', upload.single('image'), admin.adminUpdateVariant);
router.delete('/variants/:id', admin.adminDeleteVariant);

// Banners
router.get('/banners', admin.adminGetBanners);
router.post('/banners', upload.single('image'), admin.adminCreateBanner);
router.put('/banners/reorder', admin.adminReorderBanners);
router.put('/banners/:id', upload.single('image'), admin.adminUpdateBanner);
router.delete('/banners/:id', admin.adminDeleteBanner);

// Settings
router.get('/settings', admin.adminGetSettings);
router.put('/settings', admin.adminUpdateSettings);

// Reviews
import * as review from '../controllers/reviewController';
router.get('/reviews', review.getAllReviews);
router.put('/reviews/bulk-approve', review.bulkApproveReviews);
router.put('/reviews/:id/approve', review.approveReview);
router.delete('/reviews/:id', review.deleteReview);

export default router;
