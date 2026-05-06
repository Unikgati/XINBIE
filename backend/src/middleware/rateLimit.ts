import rateLimit from 'express-rate-limit';

/**
 * Strict rate limiter for sensitive authentication endpoints.
 * Limits to 5 requests per 10 minutes per IP.
 */
export const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // Limit each IP to 5 requests per window
  message: { message: 'Terlalu banyak percobaan, silakan coba lagi dalam 10 menit' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Standard rate limiter for general login attempts.
 * Limits to 10 requests per 15 minutes per IP.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Terlalu banyak percobaan login, silakan coba lagi dalam 15 menit' },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Generic rate limiter for API endpoints.
 * Limits to 100 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Terlalu banyak permintaan, silakan coba lagi nanti' },
  standardHeaders: true,
  legacyHeaders: false,
});
