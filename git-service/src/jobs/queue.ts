import { Queue } from 'bullmq';
import { bullConnection } from '../lib/redis';

export interface SyncJobData {
  userId: string;
  connectionId: string;
  trigger: 'schedule' | 'manual';
}

export const SYNC_QUEUE = 'sync';
export const SYNC_JOB = 'sync';

/** BullMQ queue — sync work runs on workers, never on the request thread. */
export const syncQueue = new Queue<SyncJobData, unknown, string>(SYNC_QUEUE, {
  connection: bullConnection,
});

export async function enqueueSync(data: SyncJobData): Promise<string> {
  const job = await syncQueue.add(SYNC_JOB, data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  });
  return job.id ?? '';
}
