import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';
import { UnauthenticatedError } from '../utils/errors';
import logger from '../lib/logger';

// Verify the SAME user JWT web-backend issues (S1): `Authorization: Bearer <token>`.
// No static internal key — the browser/extension presents the user's own token.
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthenticatedError('Missing or invalid Authorization header'));
    return;
  }
  try {
    req.user = verifyToken(header.slice('Bearer '.length));
    next();
  } catch (err) {
    logger.warn({ err, reqId: req.id }, 'Invalid or expired JWT');
    next(new UnauthenticatedError('Invalid or expired token'));
  }
}
