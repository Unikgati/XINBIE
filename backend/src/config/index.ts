import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.API_PORT || '3001'),
  appName: process.env.APP_NAME || 'Dapur Gizi',
  apiUrl: process.env.API_URL || 'http://localhost:3001',
  adminUrl: process.env.ADMIN_URL || 'http://localhost:3000',
  adminWa: process.env.ADMIN_WA || '',

  jwt: {
    secret: process.env.JWT_SECRET || 'change_me',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '1h',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '30d',
  },

  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
    bucket: process.env.MINIO_BUCKET || 'dapurgizi',
    useSSL: process.env.MINIO_USE_SSL === 'true',
  },

  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  },

  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587'),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'noreply@dapurgizi.com',
  },

  osrm: {
    url: process.env.OSRM_URL || 'https://router.project-osrm.org',
  },

  nominatim: {
    url: process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
};
