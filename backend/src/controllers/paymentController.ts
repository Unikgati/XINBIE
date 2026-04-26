import { Request, Response } from 'express';
import { coreApi } from '../config/midtrans';
import prisma from '../config/database';

// POST /api/payments/webhook/midtrans
export async function midtransWebhook(req: Request, res: Response) {
  try {
    const notificationJson = req.body;
    const statusResponse = await coreApi.transaction.notification(notificationJson);
    
    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    let newPaymentStatus = 'PENDING';
    let newOrderStatus = 'WAITING_PAYMENT';

    // Parse status based on Midtrans documentation
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        newPaymentStatus = 'PAID';
        newOrderStatus = 'RECEIVED';
      }
    } else if (transactionStatus === 'settlement') {
      newPaymentStatus = 'PAID';
      newOrderStatus = 'RECEIVED';
    } else if (transactionStatus === 'cancel' || transactionStatus === 'deny' || transactionStatus === 'expire') {
      newPaymentStatus = 'FAILED';
      newOrderStatus = 'CANCELLED';
    } else if (transactionStatus === 'pending') {
      newPaymentStatus = 'PENDING';
      newOrderStatus = 'WAITING_PAYMENT';
    }

    const currentOrder = await prisma.order.findUnique({ where: { id: orderId } });
    if (!currentOrder) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Only update if status changed and not COD
    if (currentOrder.paymentMethod !== 'COD' && currentOrder.paymentStatus !== newPaymentStatus) {
      await prisma.$transaction(async (tx) => {
        // Update Order
        await tx.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: newPaymentStatus as any,
            orderStatus: newOrderStatus as any,
          },
        });

        // Add Log
        await tx.orderStatusLog.create({
          data: {
            orderId,
            status: newOrderStatus as any,
            note: `Midtrans Webhook: ${transactionStatus}`,
          },
        });

        // If cancelled/failed, return stock
        if (newOrderStatus === 'CANCELLED' && currentOrder.orderStatus !== 'CANCELLED') {
          const items = await tx.orderItem.findMany({ where: { orderId } });
          for (const item of items) {
            if (item.productId) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stockQty: { increment: item.qty } },
              });
            }
          }
        }
      });
    }

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Midtrans Webhook Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
