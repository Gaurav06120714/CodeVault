import type { Request, Response, NextFunction } from 'express';
import logger from '../lib/logger';
import { AppError } from '../utils/errors';
import type { ApiErrorBody } from '../types';

export function notFoundHandler(req: Request, res: Response): void {
  const body: ApiErrorBody = { error: { code: 'NOT_FOUND', message: `Cannot ${req.method} ${req.path}` } };
  res.status(404).json(body);
}

// Central error formatter — maps AppError to its status/code, everything else to 500.
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error({ err, reqId: req.id }, err.message);
    else logger.warn({ code: err.code, reqId: req.id }, err.message);
    const body: ApiErrorBody = { error: { code: err.code, message: err.message } };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error({ err, reqId: req.id }, 'Unhandled error');
  const body: ApiErrorBody = { error: { code: 'INTERNAL', message: 'Internal server error' } };
  res.status(500).json(body);
}
