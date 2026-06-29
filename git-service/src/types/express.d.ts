import type { JwtPayload } from '../lib/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload; // set by requireAuth
      id?: string; // set by requestId middleware
    }
  }
}

export {};
