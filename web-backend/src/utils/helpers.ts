import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps an async route handler so rejected promises flow to the error
 * middleware instead of crashing the process (Express 4 doesn't await handlers).
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/** Normalizes a GitHub login into a valid public handle: ^[a-z0-9_-]{3,30}$ */
export function toHandle(login: string): string {
  const base = login.toLowerCase().replace(/[^a-z0-9_-]/g, '-').slice(0, 30);
  return base.length >= 3 ? base : `${base}-cv`.slice(0, 30);
}
