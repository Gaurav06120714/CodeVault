import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/lib/prisma', () => ({
  default: { githubRepo: { findMany: vi.fn() } },
}));

import prisma from '../src/lib/prisma';
import { list } from '../src/controllers/repo.controller';

const mockFindMany = prisma.githubRepo.findMany as unknown as ReturnType<typeof vi.fn>;

function mockRes() {
  return { json: vi.fn() } as any;
}

beforeEach(() => vi.clearAllMocks());

describe('GET /api/repos controller', () => {
  it('returns the caller-scoped repos as { items }', async () => {
    const rows = [{ id: 'r1', platform: 'leetcode', repoFullName: 'me/repo' }];
    mockFindMany.mockResolvedValue(rows);
    const res = mockRes();

    await list({ user: { userId: 'user_1' } } as any, res);

    // ownership: the query is scoped to the authenticated user only
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user_1' } }),
    );
    expect(res.json).toHaveBeenCalledWith({ items: rows });
  });

  it('returns an empty list when the user has no repos', async () => {
    mockFindMany.mockResolvedValue([]);
    const res = mockRes();
    await list({ user: { userId: 'user_2' } } as any, res);
    expect(res.json).toHaveBeenCalledWith({ items: [] });
  });
});
