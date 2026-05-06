import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as auth from '../controllers/authController';

import { upload } from '../middleware/upload';

import { authLimiter, loginLimiter } from '../middleware/rateLimit';

import { body, validationResult } from 'express-validator';

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const router = Router();

router.post('/register', 
  authLimiter, 
  [
    body('email').isEmail().withMessage('Format email tidak valid'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
    body('name').notEmpty().withMessage('Nama wajib diisi'),
  ],
  validate,
  auth.register
);
router.post('/verify-email', auth.verifyEmail);
router.post('/login', loginLimiter, auth.login);
router.post('/google', loginLimiter, auth.googleAuth);
router.post('/refresh', auth.refresh);
router.post('/forgot-password', authLimiter, auth.forgotPassword);
router.post('/verify-reset-otp', auth.verifyResetOtp);
router.post('/reset-password', auth.resetPassword);
router.post('/resend-otp', authLimiter, auth.resendOtp);
router.get('/me', authenticate, auth.getMe);
router.put('/profile', authenticate, upload.single('avatar'), auth.updateProfile);
router.put('/fcm-token', authenticate, auth.updateFcmToken);
router.post('/logout', authenticate, auth.logout);

export default router;
