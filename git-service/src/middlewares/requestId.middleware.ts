import { randomUUID } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

// Assign each request a correlation id (reuse an inbound X-Request-Id if present)
// and echo it back, so a request can be traced across logs.
export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.headers['x-request-id'];
  const id = (Array.isArray(incoming) ? incoming[0] : incoming) || randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
}
