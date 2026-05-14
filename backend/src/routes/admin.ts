import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as admin from '../controllers/adminController';
import * as flashSale from '../controllers/flashSaleController';

const router = Router();

router.use(authenticate, requireRole('ADMIN'));

// Dashboard
router.get('/dashboard', admin.getDashboard);

// Products
router.get('/products', admin.adminGetProducts);
router.post('/products', upload.array('images', 5), admin.adminCreateProduct);
router.put('/products/:id', upload.array('images', 5), admin.adminUpdateProduct);
router.delete('/products/:id', admin.adminDeleteProduct);

// Product Variants
router.get('/products/:productId/variants', admin.adminGetVariants);
router.post('/products/:productId/variants', upload.single('image'), admin.adminCreateVariant);
router.put('/variants/:id', upload.single('image'), admin.adminUpdateVariant);
router.delete('/variants/:id', admin.adminDeleteVariant);

// Categories
router.get('/categories', admin.adminGetCategories);
router.post('/categories', upload.single('icon'), admin.adminCreateCategory);
router.put('/categories/reorder', admin.adminReorderCategories);
router.put('/categories/:id', upload.single('icon'), admin.adminUpdateCategory);

// Orders
router.get('/orders/unread-count', admin.adminGetUnreadCount);
router.get('/orders', admin.adminGetOrders);
router.get('/orders/:id', admin.adminGetOrderDetail);
router.put('/orders/:id/status', admin.adminUpdateOrderStatus);
router.put('/orders/:id/read', admin.adminMarkOrderAsRead);


// Users
router.get('/users', admin.adminGetUsers);
router.get('/users/:id', admin.adminGetUserDetail);
router.put('/users/:id/toggle', admin.adminToggleUser);

// Banners
router.get('/banners', admin.adminGetBanners);
router.post('/banners', upload.single('image'), admin.adminCreateBanner);
router.put('/banners/reorder', admin.adminReorderBanners);
router.put('/banners/:id', upload.single('image'), admin.adminUpdateBanner);
router.delete('/banners/:id', admin.adminDeleteBanner);

// Promos
router.get('/promos', admin.adminGetPromos);
router.post('/promos', admin.adminCreatePromo);
router.put('/promos/:id', admin.adminUpdatePromo);
router.delete('/promos/:id', admin.adminDeletePromo);

// Flash Sales
router.get('/flash-sales', flashSale.getFlashSales);
router.get('/flash-sales/:id', flashSale.getFlashSaleDetail);
router.post('/flash-sales', flashSale.createFlashSale);
router.put('/flash-sales/:id', flashSale.updateFlashSale);
router.delete('/flash-sales/:id', flashSale.deleteFlashSale);

// Settings
router.get('/settings', admin.adminGetSettings);
router.put('/settings', admin.adminUpdateSettings);

// Delivery Slots
router.get('/delivery-slots', admin.adminGetDeliverySlots);
router.post('/delivery-slots', admin.adminCreateDeliverySlot);
router.put('/delivery-slots/day/:day', admin.adminUpdateDeliverySlotsByDay);
router.put('/delivery-slots/:id', admin.adminUpdateDeliverySlot);
router.delete('/delivery-slots/:id', admin.adminDeleteDeliverySlot);


// Cooking Videos
router.get('/cooking-videos', admin.adminGetCookingVideos);
router.post('/cooking-videos', admin.adminCreateCookingVideo);
router.put('/cooking-videos/:id', admin.adminUpdateCookingVideo);
router.delete('/cooking-videos/:id', admin.adminDeleteCookingVideo);

export default router;
