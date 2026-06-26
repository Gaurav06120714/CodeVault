import { Worker } from 'bullmq';
import { bullConnection } from '../lib/redis';
import { env } from '../config/env';
import { logger } from '../lib/logger';
import { runSync } from '../services/sync.service';
import { SYNC_QUEUE, type SyncJobData } from './queue';

/** Starts the BullMQ worker that processes sync jobs with bounded concurrency. */
export function startSyncWorker(): Worker<SyncJobData, unknown, string> {
  const worker = new Worker<SyncJobData, unknown, string>(
    SYNC_QUEUE,
    async (job) => {
      const { userId, connectionId, trigger } = job.data;
      logger.info({ jobId: job.id, connectionId }, 'processing sync job');
      return runSync(userId, connectionId, trigger);
    },
    { connection: bullConnection, concurrency: env.SYNC_CONCURRENCY },
  );

  worker.on('failed', (job, err) => logger.error({ jobId: job?.id, err }, 'sync job failed'));
  worker.on('completed', (job) => logger.info({ jobId: job.id }, 'sync job completed'));
  return worker;
}
