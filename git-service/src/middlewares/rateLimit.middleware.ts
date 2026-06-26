import type { Request, Response, NextFunction } from 'express';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { RateLimitError } from '../utils/errors';

interface RateLimitOptions {
  windowSec: number;
  max: number;
  keyPrefix: string;
}

/** Redis fixed-window limiter (per user when authed, else per IP). Fails open. */
export function rateLimit({ windowSec, max, keyPrefix }: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction): void => {
    void (async () => {
      const identity = req.user?.id ?? req.ip ?? 'unknown';
      const key = `rl:${keyPrefix}:${identity}`;
      try {
        const count = await redis.incr(key);
        if (count === 1) await redis.expire(key, windowSec);
        res.setHeader('X-RateLimit-Limit', String(max));
        res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - count)));
        if (count > max) throw new RateLimitError();
        next();
      } catch (err) {
        if (err instanceof RateLimitError) return next(err);
        logger.warn({ err }, 'rate-limit check failed — allowing request');
        next();
      }
    })();
  };
}
