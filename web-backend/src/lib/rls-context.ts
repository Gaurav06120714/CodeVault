/**
 * RLS Context — AsyncLocalStorage-based per-request user context.
 *
 * The auth middleware calls `withRlsContext(userId, next)` so that every
 * downstream Prisma call can read the authenticated userId and set the
 * PostgreSQL GUC `app.current_user_id` for Row-Level Security.
 */
import { AsyncLocalStorage } from 'async_hooks';

interface RlsStore {
  userId: string;
}

export const rlsContext = new AsyncLocalStorage<RlsStore>();

/**
 * Run `fn` inside an async context that carries the authenticated userId.
 */
export function withRlsContext<T>(userId: string, fn: () => T): T {
  return rlsContext.run({ userId }, fn);
}

/**
 * Read the current userId from the async context (returns undefined if not set,
 * e.g. for unauthenticated/public routes).
 */
export function getRlsUserId(): string | undefined {
  return rlsContext.getStore()?.userId;
}
