import Redis from 'ioredis';
import { config } from './index';

const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 50, 2000),
});

redis.on('error', (err) => console.error('Redis error:', err.message));
redis.on('connect', () => console.log('✅ Redis connected'));

export default redis;
