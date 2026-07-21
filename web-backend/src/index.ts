import { createApp } from './app';
import { startServer } from './server';
import logger from './lib/logger';
import { initSentry } from './lib/sentry';

const main = async () => {
  try {
    initSentry();
    const app = createApp();
    await startServer(app);
  } catch (err) {
    logger.fatal(err, 'Failed to start server');
    process.exit(1);
  }
};

main();
