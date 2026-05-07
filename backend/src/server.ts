import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

import { config } from './config';
import { ensureBucket } from './config/minio';
import { errorHandler } from './middleware/errorHandler';
import { initWebSocket } from './websocket';
import { initFirebase } from './utils/firebase';

// Routes
import authRoutes from './routes/auth';
import productRoutes from './routes/product';
import addressRoutes from './routes/address';
import regionRoutes from './routes/region';
import deliveryRoutes from './routes/delivery';
import orderRoutes from './routes/order';
import driverRoutes from './routes/driver';
import notificationRoutes from './routes/notification';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payment';
import promoRoutes from './routes/promo';
import aiRoutes from './routes/ai';
import chatRoutes from './routes/chat';
import flashSaleRoutes from './routes/flashSale';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());

const allowedOrigins = [
  config.adminUrl,
  process.env.USER_WEB_URL || 'http://localhost:3000',
  'http://localhost:3002' // sometimes used for other mobile builds or local test
];

app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
import { apiLimiter } from './middleware/rateLimit';
app.use('/api/', apiLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/regions', regionRoutes);
app.use('/api', deliveryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/promos', promoRoutes);
app.use('/api/admin/ai', aiRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', flashSaleRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

// Error handler
app.use(errorHandler);

// WebSocket
initWebSocket(server);

// Start
async function start() {
  try {
    await ensureBucket();
    initFirebase();
    server.listen(config.port, () => {
      console.log(`\n🚀 ${config.appName} API running on port ${config.port}`);
      console.log(`📍 ${config.apiUrl}`);
      console.log(`🔌 WebSocket ready\n`);
    });
  } catch (err) {
    console.error('❌ Failed to start:', err);
    process.exit(1);
  }
}

start();

// Raw Debug Route
app.get('/api/debug/fs', async (req, res) => {
  const fs = await prisma.flashSale.findMany({ include: { items: true } });
  res.json({ now: new Date().toISOString(), data: fs });
});

export default app;
