import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from './logger';

/**
 * Shared Redis connection (locks + BullMQ). BullMQ requires
 * maxRetriesPerRequest = null on its connection.
 */
const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

redis.on('error', (err) => logger.warn({ err }, 'redis connection error'));

if (env.NODE_ENV === 'development') globalForRedis.redis = redis;

/**
 * Connection options for BullMQ (it bundles its own ioredis, so we pass plain
 * options rather than our client instance to avoid a dual-package type clash).
 */
const redisUrl = new URL(env.REDIS_URL);
export const bullConnection = {
  host: redisUrl.hostname,
  port: Number(redisUrl.port || 6379),
};
