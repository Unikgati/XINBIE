import { Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';

// GET /api/notifications
export async function getNotifications(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { page = '1', limit = '20' } = req.query;
    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.userId! },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.notification.count({ where: { userId: req.userId! } }),
      prisma.notification.count({ where: { userId: req.userId!, isRead: false } }),
    ]);

    res.json({ data: notifications, unreadCount, meta: { total, page: parseInt(page as string) } });
  } catch (err) { next(err); }
}

// PUT /api/notifications/:id/read
export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id as string, userId: req.userId! },
      data: { isRead: true },
    });
    res.json({ message: 'Notifikasi dibaca' });
  } catch (err) { next(err); }
}

// PUT /api/notifications/read-all
export async function markAllAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: 'Semua notifikasi dibaca' });
  } catch (err) { next(err); }
}
