import { Queue } from 'bullmq';
import { bullConnection } from '../lib/redis';

export interface SyncJobData {
  connectionId: string;
  trigger: 'schedule' | 'manual';
}

export const SYNC_QUEUE = 'sync';
export const SYNC_JOB = 'sync';

export const syncQueue = new Queue<SyncJobData>(SYNC_QUEUE, {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    // Remove on terminal state so the per-connection jobId frees up for the next run.
    removeOnComplete: true,
    removeOnFail: true,
  },
});

// Enqueue a sync. The jobId dedups concurrent enqueues for the same connection,
// so a connection never has two pending sync jobs at once.
export async function enqueueSync(data: SyncJobData): Promise<string | undefined> {
  const job = await syncQueue.add(SYNC_JOB, data, { jobId: `sync:${data.connectionId}` });
  return job.id;
}
