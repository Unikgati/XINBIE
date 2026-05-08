import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import redis from '../config/redis';
import prisma from '../config/database';

let io: Server;
const disconnectTimers = new Map<string, NodeJS.Timeout>();

export function initWebSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  });

  // Auth middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    try {
      const payload = verifyToken(token);
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = (socket as any).userId;
    const role = (socket as any).userRole;

    // Join personal room
    socket.join(`user:${userId}`);

    // Join role-based room
    if (role === 'DRIVER') {
      socket.join('drivers');
    } else if (role === 'ADMIN') {
      socket.join('admins');
    }

    // Handle grace period for driver reconnection
    if (role === 'DRIVER') {
      const timer = disconnectTimers.get(userId);
      if (timer) {
        clearTimeout(timer);
        disconnectTimers.delete(userId);
      }
    }

    console.log(`🔌 ${role} connected: ${userId}`);

    // Driver location update
    socket.on('driver:location', async (data: { lat: number; lng: number }) => {
      if (role !== 'DRIVER') return;

      // Store in Redis for real-time
      await redis.setex(
        `driver:location:${userId}`,
        60,
        JSON.stringify({ ...data, updatedAt: Date.now() }),
      );

      // Broadcast to admins
      io.to('admins').emit('driver:location', { driverId: userId, ...data });
    });

    // Driver accepts order
    socket.on('order:accept', (data: { orderId: string }) => {
      if (role !== 'DRIVER') return;
      io.to('admins').emit('order:accepted', { ...data, driverId: userId });
    });

    socket.on('disconnect', async () => {
      console.log(`🔌 ${role} disconnected: ${userId}`);
      
      if (role === 'DRIVER') {
        // Wait 30 seconds before marking offline (Grace Period for network drops)
        const timer = setTimeout(async () => {
          try {
            await prisma.driverProfile.update({
              where: { userId },
              data: { isOnline: false },
            });
            console.log(`📡 Driver ${userId} marked OFFLINE due to timeout`);
            emitToAdmins('driver:status', { driverId: userId, isOnline: false });
          } catch (e) {
            console.error(`Failed to mark driver offline: ${userId}`, e);
          }
          disconnectTimers.delete(userId);
        }, 30000); // 30 seconds

        disconnectTimers.set(userId, timer);
      }
    });
  });

  return io;
}

/** Emit to specific user */
export function emitToUser(userId: string, event: string, data: any) {
  io?.to(`user:${userId}`).emit(event, data);
}

/** Emit to all online drivers */
export function emitToDrivers(event: string, data: any) {
  io?.to('drivers').emit(event, data);
}

/** Emit to admins */
export function emitToAdmins(event: string, data: any) {
  io?.to('admins').emit(event, data);
}

/** Broadcast order offer to nearby drivers */
export async function broadcastOrderOffer(orderId: string, orderData: any) {
  emitToDrivers('order:new', { orderId, ...orderData });
}

/** Notify user of order status change */
export function notifyOrderStatus(userId: string, orderId: string, status: string) {
  emitToUser(userId, 'order:status', { orderId, status });
}

/** Notify payment update */
export function notifyPayment(userId: string, orderId: string, status: string) {
  emitToUser(userId, 'payment:update', { orderId, status });
}

/** Emit Flash Sale stock update to all clients */
export function emitFlashSaleStock(flashSaleItemId: string, soldQty: number, stockQty: number) {
  io?.emit('flash_sale:stock', { flashSaleItemId, soldQty, stockQty });
}
