import type { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import logger from '../lib/logger';
import { RateLimitError } from '../utils/errors';

interface RateLimitOptions {
  windowSec: number;
  max: number;
  keyPrefix: string;
}

// Fixed-window per-user (or per-IP) rate limiter backed by Redis.
export function rateLimit({ windowSec, max, keyPrefix }: RateLimitOptions) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = req.user?.userId ?? req.ip ?? 'anon';
      const key = `rl:${keyPrefix}:${id}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, windowSec);
      if (count > max) {
        next(new RateLimitError('Rate limit exceeded'));
        return;
      }
      next();
    } catch (err) {
      // Fail open on Redis hiccups — don't block legitimate traffic.
      logger.warn({ err }, 'rate limiter error; allowing request');
      next();
    }
  };
}
