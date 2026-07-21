import type { Server } from 'node:http';
import { createApp } from './app';
import { env } from './config/env';
import logger from './lib/logger';
import prisma from './lib/prisma';
import { redis } from './lib/redis';
import { initSentry } from './lib/sentry';

export function startServer(): Server {
  initSentry();
  const app = createApp();
  const port = Number(env.PORT);

  const server = app.listen(port, () => {
    logger.info({ port }, 'git-service listening');
  });

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'shutting down git-service');
    server.close(async () => {
      try {
        await prisma.$disconnect();
        await redis.quit();
      } catch (err) {
        logger.error(err, 'error during shutdown');
      }
      process.exit(0);
    });
    // Force-exit if graceful close hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  return server;
}
