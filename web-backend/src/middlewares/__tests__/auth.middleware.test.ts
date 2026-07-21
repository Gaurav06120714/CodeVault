import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../utils/jwt', () => ({ verifyToken: vi.fn() }));
// Run the wrapped continuation synchronously so we can assert on next().
vi.mock('../../lib/rls-context', () => ({
  withRlsContext: (_userId: string, fn: () => void) => fn(),
}));

import { requireAuth } from '../auth.middleware';
import { verifyToken } from '../../utils/jwt';

const mockedVerify = vi.mocked(verifyToken);

function ctx(over: Partial<{ cookies: any; headers: any }> = {}) {
  const req: any = { cookies: over.cookies ?? {}, headers: over.headers ?? {} };
  const res: any = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
}

describe('requireAuth (BOLA / authentication gate)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects with 401 when no token is present', () => {
    const { req, res, next } = ctx();
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects with 401 when the token is invalid/expired', () => {
    mockedVerify.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    const { req, res, next } = ctx({ cookies: { cv_access: 'bad.token' } });
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts a valid HttpOnly cookie token and binds req.user (the RLS identity)', () => {
    mockedVerify.mockReturnValue({ userId: 'user-1' } as any);
    const { req, res, next } = ctx({ cookies: { cv_access: 'good.token' } });
    requireAuth(req, res, next);
    expect(req.user).toEqual({ userId: 'user-1' });
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalledWith(401);
  });

  it('accepts a Bearer header token (extension / API clients)', () => {
    mockedVerify.mockReturnValue({ userId: 'user-2' } as any);
    const { req, res, next } = ctx({ headers: { authorization: 'Bearer good.token' } });
    requireAuth(req, res, next);
    expect(req.user).toEqual({ userId: 'user-2' });
    expect(next).toHaveBeenCalled();
  });
});
