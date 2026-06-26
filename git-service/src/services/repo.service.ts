import { prisma } from '../lib/prisma';
import { decrypt } from '../lib/crypto';
import { listCommits as ghListCommits } from './github/github.service';
import { padNumber, langToExt } from '../utils/helpers';
import type { PlatformName, Paginated } from '../types';
import type { CommitInfo } from '../types/github.types';

export interface RepoInfoDto {
  platform: PlatformName;
  repoFullName: string;
  visibility: 'public' | 'private';
  fileCount: number;
  defaultBranch: string;
  lastSyncAt: string | null;
}

export interface RepoFileDto {
  number: string;
  title: string;
  language: string;
  path: string;
  updatedAt: string;
}

export async function listRepos(userId: string): Promise<RepoInfoDto[]> {
  const rows = await prisma.githubRepo.findMany({ where: { userId }, orderBy: { platform: 'asc' } });
  return rows.map((r) => ({
    platform: r.platform,
    repoFullName: r.repoFullName,
    visibility: r.visibility,
    fileCount: r.fileCount,
    defaultBranch: r.defaultBranch,
    lastSyncAt: r.lastSyncAt ? r.lastSyncAt.toISOString() : null,
  }));
}

/** Synced problems as repo files (cursor-paginated). */
export async function listFiles(
  userId: string,
  platform: PlatformName,
  opts: { cursor?: string; limit?: number },
): Promise<Paginated<RepoFileDto>> {
  const limit = Math.min(Math.max(opts.limit ?? 20, 1), 50);
  const rows = await prisma.problem.findMany({
    where: { userId, platform, syncedToGit: true },
    orderBy: { number: 'asc' },
    take: limit + 1,
    ...(opts.cursor ? { cursor: { id: opts.cursor }, skip: 1 } : {}),
  });
  const hasMore = rows.length > limit;
  const items = rows.slice(0, limit);
  return {
    items: items.map((p) => ({
      number: padNumber(p.number),
      title: p.title,
      language: p.language ?? 'txt',
      path: p.solutionPath ?? `${padNumber(p.number)}/solution.${langToExt(p.language)}`,
      updatedAt: p.updatedAt.toISOString(),
    })),
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}

/** Recent commits from the user's synced repo (live GitHub call). */
export async function listCommits(userId: string, platform: PlatformName): Promise<CommitInfo[]> {
  const repo = await prisma.githubRepo.findUnique({
    where: { userId_platform: { userId, platform } },
  });
  if (!repo) return [];
  const oauth = await prisma.oAuthIdentity.findFirst({ where: { userId, provider: 'github' } });
  if (!oauth) return [];
  const token = decrypt(oauth.accessTokenCipher, oauth.tokenIv);
  return ghListCommits(token, repo.repoFullName);
}
