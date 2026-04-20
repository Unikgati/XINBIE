import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as admin from '../controllers/adminController';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

// Dashboard
router.get('/dashboard', admin.getDashboard);

// Products
router.get('/products', admin.adminGetProducts);
router.post('/products', upload.array('images', 5), admin.adminCreateProduct);
router.put('/products/:id', upload.array('images', 5), admin.adminUpdateProduct);
router.delete('/products/:id', admin.adminDeleteProduct);

// Categories
router.get('/categories', admin.adminGetCategories);
router.post('/categories', upload.single('icon'), admin.adminCreateCategory);
router.put('/categories/:id', upload.single('icon'), admin.adminUpdateCategory);

// Orders
router.get('/orders', admin.adminGetOrders);
router.put('/orders/:id/status', admin.adminUpdateOrderStatus);

// Drivers
router.get('/drivers', admin.adminGetDrivers);
router.put('/drivers/:id/verify', admin.adminVerifyDriver);

// Users
router.get('/users', admin.adminGetUsers);
router.put('/users/:id/toggle', admin.adminToggleUser);

// Banners
router.get('/banners', admin.adminGetBanners);
router.post('/banners', upload.single('image'), admin.adminCreateBanner);
router.put('/banners/:id', upload.single('image'), admin.adminUpdateBanner);
router.delete('/banners/:id', admin.adminDeleteBanner);

// Promos
router.get('/promos', admin.adminGetPromos);
router.post('/promos', admin.adminCreatePromo);
router.put('/promos/:id', admin.adminUpdatePromo);

// Settings
router.get('/settings', admin.adminGetSettings);
router.put('/settings', admin.adminUpdateSettings);

// Broadcast
router.post('/broadcast', admin.adminBroadcast);

export default router;
