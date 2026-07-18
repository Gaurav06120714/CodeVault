import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/prisma', () => ({
  default: { problem: { findMany: vi.fn() } },
}));

import prisma from '../src/lib/prisma';
import { list } from '../src/controllers/problem.controller';

const p = prisma as any;
const mockRes = () => ({ json: vi.fn() } as any);
const req = (query: any = {}) => ({ user: { userId: 'user_1' }, query } as any);
const rows = (...ids: string[]) => ids.map((id) => ({ id, platform: 'leetcode', slug: id, title: id }));

beforeEach(() => vi.clearAllMocks());

describe('GET /api/problems list', () => {
  it('scopes to the caller and paginates via nextCursor', async () => {
    // limit=2 → take 3; return 3 → hasMore, page trimmed to 2
    p.problem.findMany.mockResolvedValue(rows('a', 'b', 'c'));
    const res = mockRes();
    await list(req({ limit: '2' }), res);

    expect(p.problem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user_1' }, take: 3 }),
    );
    const out = res.json.mock.calls[0][0];
    expect(out.items).toHaveLength(2);
    expect(out.nextCursor).toBe('b');
  });

  it('returns nextCursor null when fewer than limit rows', async () => {
    p.problem.findMany.mockResolvedValue(rows('a'));
    const res = mockRes();
    await list(req({ limit: '2' }), res);
    expect(res.json.mock.calls[0][0].nextCursor).toBeNull();
  });

  it('applies a valid platform filter', async () => {
    p.problem.findMany.mockResolvedValue([]);
    await list(req({ platform: 'codechef' }), mockRes());
    expect(p.problem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user_1', platform: 'codechef' } }),
    );
  });

  it('ignores an invalid platform (no platform in the where clause)', async () => {
    p.problem.findMany.mockResolvedValue([]);
    await list(req({ platform: 'spoj' }), mockRes());
    expect(p.problem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user_1' } }),
    );
  });

  it('clamps an over-large limit to 100 (take 101)', async () => {
    p.problem.findMany.mockResolvedValue([]);
    await list(req({ limit: '9999' }), mockRes());
    expect(p.problem.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 101 }));
  });

  it('applies the keyset cursor when provided', async () => {
    p.problem.findMany.mockResolvedValue([]);
    await list(req({ cursor: 'xyz' }), mockRes());
    expect(p.problem.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: { id: 'xyz' }, skip: 1 }),
    );
  });
});
