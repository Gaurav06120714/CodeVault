import type { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { enqueueSync } from '../jobs/queue';
import { ForbiddenError, NotFoundError } from '../utils/errors';
import type { TriggerSyncInput } from '../validators/sync.validator';

// POST /api/sync — enqueue a sync for one owned connection, or all of the caller's connections.
export async function trigger(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { connectionId } = req.body as TriggerSyncInput;

  if (connectionId) {
    const conn = await prisma.connection.findUnique({
      where: { id: connectionId },
      select: { userId: true, deletedAt: true },
    });
    if (!conn || conn.deletedAt) throw new NotFoundError('Connection not found');
    if (conn.userId !== userId) throw new ForbiddenError('Not your connection');

    const jobId = await enqueueSync({ connectionId, trigger: 'manual' });
    res.status(202).json({ accepted: true, jobs: jobId ? [jobId] : [] });
    return;
  }

  const conns = await prisma.connection.findMany({
    where: { userId, syncEnabled: true, deletedAt: null },
    select: { id: true },
  });
  let count = 0;
  for (const c of conns) {
    await enqueueSync({ connectionId: c.id, trigger: 'manual' });
    count += 1;
  }
  res.status(202).json({ accepted: true, count });
}

// GET /api/sync/status — per-connection sync status for the caller.
export async function status(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const connections = await prisma.connection.findMany({
    where: { userId, deletedAt: null },
    select: {
      id: true,
      platform: true,
      username: true,
      tokenStatus: true,
      syncEnabled: true,
      lastSyncedAt: true,
      _count: { select: { problems: true } },
    },
  });

  const items = connections.map((c) => ({
    connectionId: c.id,
    platform: c.platform,
    username: c.username,
    status: c.tokenStatus === 'expired' ? 'expired' : 'active',
    syncEnabled: c.syncEnabled,
    lastSyncedAt: c.lastSyncedAt,
    itemsSynced: c._count.problems,
  }));

  res.json({ items });
}
