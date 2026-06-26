import type { Request, Response, NextFunction } from 'express';
import type { ZodTypeAny } from 'zod';
import { ValidationError } from '../utils/errors';

function validate(segment: 'body' | 'query' | 'params', schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[segment]);
    if (!result.success) {
      throw new ValidationError(
        'Validation failed',
        result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      );
    }
    Object.assign(req[segment] as object, result.data);
    next();
  };
}

export const validateBody = (schema: ZodTypeAny) => validate('body', schema);
export const validateQuery = (schema: ZodTypeAny) => validate('query', schema);
export const validateParams = (schema: ZodTypeAny) => validate('params', schema);
