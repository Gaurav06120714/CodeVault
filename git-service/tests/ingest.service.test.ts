import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHash } from 'node:crypto';

// ── Mocks (no DB / GitHub / network) ────────────────────────────────────────
vi.mock('../src/lib/prisma', () => ({
  default: {
    oAuthIdentity: { findFirst: vi.fn() },
    connection: { findUnique: vi.fn(), update: vi.fn() },
    githubRepo: { findUnique: vi.fn(), update: vi.fn() },
    syncRun: { create: vi.fn(), update: vi.fn() },
    problem: { findMany: vi.fn(), upsert: vi.fn() },
    notification: { create: vi.fn() },
  },
}));
vi.mock('../src/lib/crypto', () => ({ decrypt: vi.fn(() => 'gh_token') }));
vi.mock('../src/services/github/github.service', () => ({
  verifyRepoAccess: vi.fn(),
  pushFiles: vi.fn(),
}));
vi.mock('../src/services/github/readme.generator', () => ({
  generateReadme: vi.fn(() => '# README'),
}));
vi.mock('../src/lib/logger', () => ({
  default: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import prisma from '../src/lib/prisma';
import { verifyRepoAccess, pushFiles } from '../src/services/github/github.service';
import { runIngest } from '../src/services/ingest.service';

const p = prisma as any;
const capture = {
  platform: 'leetcode',
  number: '1',
  slug: 'two-sum',
  title: 'Two Sum',
  difficulty: 'easy',
  topics: ['array'],
  language: 'python3',
  code: 'print(1)',
  questionMarkdown: '# Two Sum',
} as any;

const hashOf = (code: string) => createHash('sha256').update(code).digest('hex');

beforeEach(() => {
  vi.clearAllMocks();
  // default: everything present, nothing synced yet (fresh push succeeds)
  p.oAuthIdentity.findFirst.mockResolvedValue({ accessTokenCipher: Buffer.from('c'), tokenIv: Buffer.from('i') });
  p.connection.findUnique.mockResolvedValue({ id: 'conn1' });
  p.githubRepo.findUnique.mockResolvedValue({
    id: 'repo1',
    repoFullName: 'me/leetcode-solutions',
    folderConvention: 'number',
    defaultBranch: 'main',
  });
  p.syncRun.create.mockResolvedValue({ id: 'run1' });
  p.problem.findMany.mockResolvedValue([]);
  p.problem.upsert.mockResolvedValue({});
  p.syncRun.update.mockResolvedValue({});
  p.githubRepo.update.mockResolvedValue({});
  p.connection.update.mockResolvedValue({});
  p.notification.create.mockResolvedValue({});
});

describe('runIngest', () => {
  it('throws when the user has no GitHub identity', async () => {
    p.oAuthIdentity.findFirst.mockResolvedValue(null);
    await expect(runIngest('user_1', [capture])).rejects.toThrow(/No GitHub identity/);
    expect(pushFiles).not.toHaveBeenCalled();
  });

  it('skips a platform with no connection or repo mapping (never pushes)', async () => {
    p.connection.findUnique.mockResolvedValue(null);
    const result = await runIngest('user_1', [capture]);
    expect(result).toEqual({ accepted: 1, pushed: 0, skipped: 1 });
    expect(pushFiles).not.toHaveBeenCalled();
    expect(verifyRepoAccess).not.toHaveBeenCalled();
  });

  it('dedupes: an already-synced slug with identical code is skipped, not re-pushed', async () => {
    p.problem.findMany.mockResolvedValue([{ slug: 'two-sum', metadata: { codeHash: hashOf(capture.code) } }]);
    const result = await runIngest('user_1', [capture]);
    expect(result).toEqual({ accepted: 1, pushed: 0, skipped: 1 });
    expect(verifyRepoAccess).not.toHaveBeenCalled();
    expect(pushFiles).not.toHaveBeenCalled();
  });

  it('self-heals: same slug but changed code is re-pushed', async () => {
    p.problem.findMany.mockResolvedValueOnce([{ slug: 'two-sum', metadata: { codeHash: hashOf('OLD DIFFERENT CODE') } }]);
    const result = await runIngest('user_1', [capture]);
    expect(result.pushed).toBe(1);
    expect(pushFiles).toHaveBeenCalledTimes(1);
  });

  it('pushes a fresh capture to the caller’s repo and upserts the problem', async () => {
    const result = await runIngest('user_1', [capture]);
    expect(result).toEqual({ accepted: 1, pushed: 1, skipped: 0 });

    expect(verifyRepoAccess).toHaveBeenCalledWith('gh_token', 'me/leetcode-solutions');
    // pushed to THIS user's repo on its default branch
    const [token, repoFullName, branch, files] = (pushFiles as any).mock.calls[0];
    expect(token).toBe('gh_token');
    expect(repoFullName).toBe('me/leetcode-solutions');
    expect(branch).toBe('main');
    const paths = files.map((f: any) => f.path);
    expect(paths).toContain('0001/question.md');
    expect(paths).toContain('0001/solution.py');
    expect(paths).toContain('README.md');

    // problem persisted, scoped to this user + platform + slug
    expect(p.problem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_platform_slug: { userId: 'user_1', platform: 'leetcode', slug: 'two-sum' } },
      }),
    );
  });
});
