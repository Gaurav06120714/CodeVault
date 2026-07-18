import { runRetentionJob } from './retention.job';

// A manual trigger for the retention job to facilitate smoke testing and ad-hoc cleanup.
// Intended to be run via `npm run retention:run` which invokes `tsx src/jobs/run-retention.ts`.

(async () => {
  try {
    console.log('--- Starting Manual Retention Job ---');
    await runRetentionJob();
    console.log('--- Finished Manual Retention Job ---');
    process.exit(0);
  } catch (err) {
    console.error('--- Error running retention job ---');
    console.error(err);
    process.exit(1);
  }
})();
