import type { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { redis } from '../lib/redis';
import type { HealthStatus, ReadinessStatus } from '../types';

// Liveness — the process is up.
export function getHealth(_req: Request, res: Response): void {
  const body: HealthStatus = { status: 'ok', service: 'git-service', uptime: process.uptime() };
  res.json(body);
}

// Readiness — DB + Redis are reachable.
export async function getReadiness(_req: Request, res: Response): Promise<void> {
  let db = false;
  let redisOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }
  try {
    redisOk = (await redis.ping()) === 'PONG';
  } catch {
    redisOk = false;
  }
  const body: ReadinessStatus = { status: db && redisOk ? 'ready' : 'degraded', db, redis: redisOk };
  res.status(db && redisOk ? 200 : 503).json(body);
}
