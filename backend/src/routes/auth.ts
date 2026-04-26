import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as auth from '../controllers/authController';

import { upload } from '../middleware/upload';

const router = Router();

router.post('/register', auth.register);
router.post('/verify-email', auth.verifyEmail);
router.post('/login', auth.login);
router.post('/google', auth.googleAuth);
router.post('/refresh', auth.refresh);
router.post('/forgot-password', auth.forgotPassword);
router.post('/verify-reset-otp', auth.verifyResetOtp);
router.post('/reset-password', auth.resetPassword);
router.post('/resend-otp', auth.resendOtp);
router.get('/me', authenticate, auth.getMe);
router.put('/profile', authenticate, upload.single('avatar'), auth.updateProfile);
router.put('/fcm-token', authenticate, auth.updateFcmToken);
router.post('/logout', authenticate, auth.logout);

export default router;
