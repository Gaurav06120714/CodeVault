import * as Sentry from '@sentry/node';
import { env } from '../config/env';
import logger from './logger';

// Env-gated error reporting. With no SENTRY_DSN this is a complete no-op.
let enabled = false;

export function initSentry(): void {
  if (!env.SENTRY_DSN) return;
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
  });
  enabled = true;
  logger.info('Sentry error reporting enabled');
}

/** Report an exception if Sentry is configured; safe no-op otherwise. */
export function captureException(err: unknown): void {
  if (enabled) Sentry.captureException(err);
}
