import prisma from '../config/database';
import { emitToUser } from '../websocket';
import { sendPushNotification } from './firebase';

export interface NotificationPayload {
  userId: string;
  title: string;
  body: string;
  type: 'ORDER_STATUS' | 'PROMO' | 'PAYMENT' | 'SYSTEM';
  data?: any;
}

export class NotificationService {
  /**
   * Send notification to user via:
   * 1. Database (Persistent history)
   * 2. Socket.io (Real-time in-app)
   * 3. FCM (Push notification)
   */
  static async send(payload: NotificationPayload) {
    try {
      // 1. Save to Database
      const notification = await prisma.notification.create({
        data: {
          userId: payload.userId,
          title: payload.title,
          body: payload.body,
          type: payload.type,
          data: payload.data || {},
        },
        include: {
          user: { select: { fcmToken: true } }
        }
      });

      // 2. Emit via Socket.io
      emitToUser(payload.userId, 'notification:new', notification);

      // 3. Send Push Notification via FCM if token exists
      if (notification.user.fcmToken) {
        await sendPushNotification(notification.user.fcmToken, {
          title: payload.title,
          body: payload.body,
          data: {
            ...payload.data,
            notificationId: notification.id,
            type: payload.type,
          }
        });
      }

      return notification;
    } catch (error) {
      console.error('[NotificationService] Failed to send notification:', error);
      throw error;
    }
  }

  /**
   * Specific helper for order status changes
   */
  static async notifyOrderStatus(userId: string, orderId: string, orderCode: string, status: string) {
    const statusLabels: Record<string, string> = {
      'WAITING_PAYMENT': 'Menunggu Pembayaran',
      'RECEIVED': 'Pesanan Diterima',
      'PROCESSING': 'Sedang Diproses',
      'WAITING_DRIVER': 'Mencari Driver',
      'IN_DELIVERY': 'Dalam Pengiriman',
      'DELIVERED': 'Pesanan Sampai',
      'COMPLETED': 'Pesanan Selesai',
      'CANCELLED': 'Pesanan Dibatalkan',
      'PROBLEM': 'Ada Kendala pada Pesanan',
    };

    const label = statusLabels[status] || status;
    
    return this.send({
      userId,
      title: `Update Pesanan ${orderCode}`,
      body: `Status pesanan kamu sekarang: ${label}`,
      type: 'ORDER_STATUS',
      data: { orderId, orderCode, status }
    });
  }
}
