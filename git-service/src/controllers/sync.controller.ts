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

type ActivityType = 'push' | 'fetch' | 'refresh' | 'expire' | 'error';

function activityType(status: string): ActivityType {
  switch (status) {
    case 'success':
    case 'partial':
      return 'push';
    case 'failed':
      return 'error';
    case 'expired':
      return 'expire';
    default:
      return 'fetch'; // queued / running
  }
}

function activityMessage(run: {
  status: string;
  itemsPushed: number;
  itemsFetched: number;
  errorCode: string | null;
  connection: { platform: string };
}): string {
  const p = run.connection.platform;
  switch (run.status) {
    case 'success':
      return `Synced ${run.itemsPushed} problem(s) from ${p}`;
    case 'partial':
      return `Partially synced ${p} (${run.itemsPushed}/${run.itemsFetched})`;
    case 'failed':
      return `Sync failed for ${p}${run.errorCode ? ` (${run.errorCode})` : ''}`;
    case 'expired':
      return `${p} session expired — reconnect required`;
    case 'running':
      return `Syncing ${p}…`;
    default:
      return `Sync queued for ${p}`;
  }
}

// GET /api/sync/activity — real sync log feed (cursor-paginated, newest first).
export async function activity(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;
  const cursor = typeof req.query.cursor === 'string' ? req.query.cursor : undefined;

  const runs = await prisma.syncRun.findMany({
    where: { userId },
    include: { connection: { select: { platform: true, username: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const hasMore = runs.length > limit;
  const page = hasMore ? runs.slice(0, limit) : runs;

  const items = page.map((r) => ({
    id: r.id,
    type: activityType(r.status),
    message: activityMessage(r),
    platform: r.connection.platform,
    createdAt: r.createdAt,
  }));

  res.json({ items, nextCursor: hasMore ? page[page.length - 1]!.id : null });
}
