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

// Routes
import authRoutes from './routes/auth';
import productRoutes from './routes/product';
import addressRoutes from './routes/address';
import deliveryRoutes from './routes/delivery';
import orderRoutes from './routes/order';
import driverRoutes from './routes/driver';
import notificationRoutes from './routes/notification';
import adminRoutes from './routes/admin';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({ origin: (origin, callback) => callback(null, origin || '*'), credentials: true }));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { message: 'Terlalu banyak request, coba lagi nanti' },
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api', productRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api', deliveryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

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

export default app;
