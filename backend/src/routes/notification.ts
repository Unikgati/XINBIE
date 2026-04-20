import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as notification from '../controllers/notificationController';

const router = Router();

router.use(authenticate);
router.get('/', notification.getNotifications);
router.put('/:id/read', notification.markAsRead);
router.put('/read-all', notification.markAllAsRead);

export default router;
