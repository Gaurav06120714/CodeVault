import Redis from 'ioredis';
import { env } from '../config/env';
import logger from './logger';

export const redis = new Redis(env.REDIS_URL, {
  lazyConnect: true,
  // Fail fast instead of hanging requests: serverless Redis (Upstash) with a
  // bad URL/TLS config otherwise retries forever and every rate-limited route
  // (incl. login) blocks on the queued command. With these caps a dead Redis
  // surfaces as an error within ~5s and callers fall back gracefully
  // (rate limiter fails open, cache reads are skipped).
  connectTimeout: 5000,
  commandTimeout: 3000,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  retryStrategy: (times) => Math.min(times * 500, 10000),
});

redis.on('error', (err) => {
  logger.error(err, 'Redis Client Error');
});

redis.on('connect', () => {
  logger.info('Redis Client Connected');
});
