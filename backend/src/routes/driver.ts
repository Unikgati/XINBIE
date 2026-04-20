import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { upload } from '../middleware/upload';
import * as driver from '../controllers/driverController';

const router = Router();

router.use(authenticate);
router.post('/register', driver.registerDriver);
router.post('/upload-ktp', upload.single('ktp'), driver.uploadKtp);
router.get('/verification-status', driver.getVerificationStatus);
router.put('/online-status', requireRole('DRIVER'), driver.toggleOnline);
router.put('/location', requireRole('DRIVER'), driver.updateLocation);
router.get('/orders/active', requireRole('DRIVER'), driver.getActiveOrders);
router.get('/orders/history', requireRole('DRIVER'), driver.getOrderHistory);
router.put('/orders/:id/accept', requireRole('DRIVER'), driver.acceptOrder);
router.put('/orders/:id/status', requireRole('DRIVER'), driver.updateOrderStatus);
router.post('/orders/:id/proof', requireRole('DRIVER'), upload.single('proof'), driver.uploadProof);
router.post('/orders/:id/problem', requireRole('DRIVER'), upload.single('photo'), driver.reportProblem);
router.post('/orders/:id/cod-confirm', requireRole('DRIVER'), driver.confirmCod);
router.get('/earnings', requireRole('DRIVER'), driver.getEarnings);

// Wallet & Financial
router.get('/wallet', requireRole('DRIVER'), driver.getWallet);
router.post('/withdrawal', requireRole('DRIVER'), driver.requestWithdrawal);
router.get('/bank', requireRole('DRIVER'), driver.getBankInfo);
router.put('/bank', requireRole('DRIVER'), driver.updateBankInfo);

export default router;
