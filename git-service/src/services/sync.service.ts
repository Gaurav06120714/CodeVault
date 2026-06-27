import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { env } from '../config/env';
import { decrypt } from '../lib/crypto';
import { getSubmissionAdapter } from './submissions';
import { pushFiles, verifyRepoAccess } from './github/github.service';
import { generateReadme } from './github/readme.generator';
import { padNumber, langToExt } from '../utils/helpers';
import { ExpiredSessionError, NotFoundError } from '../utils/errors';
import type { PlatformName } from '../types';
import type { SyncResult, SolutionToSync } from '../types/sync.types';
import type { RepoFileEntry, GithubFile } from '../types/github.types';

const LOCK_TTL_SECONDS = 1800; // 30 min safety
const lockKey = (connectionId: string) => `lock:sync:${connectionId}`;
const semaKey = (platform: PlatformName) => `sema:platform:${platform}`;
const SEMA_TTL_SECONDS = 1800;

/**
 * Best-effort per-platform concurrency cap (Redis counter). Waits briefly for a
 * free slot; if none frees up it proceeds anyway (soft cap — never deadlocks a job).
 */
async function acquirePlatformSlot(platform: PlatformName): Promise<boolean> {
  const key = semaKey(platform);
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, SEMA_TTL_SECONDS);
    if (count <= env.SYNC_PLATFORM_CONCURRENCY) return true;
    await redis.decr(key);
    await new Promise((r) => setTimeout(r, 500));
  }
  logger.warn({ platform }, 'platform concurrency cap busy — proceeding (soft cap)');
  return false;
}

async function releasePlatformSlot(platform: PlatformName, held: boolean): Promise<void> {
  if (held) await redis.decr(semaKey(platform)).catch(() => undefined);
}

/**
 * Run one connection's sync end-to-end. Idempotent (diffs against `problems`),
 * single-flight (per-connection Redis lock), and resilient (expired session ->
 * mark connection + notify, don't crash). See ARCHITECTURE §8.
 */
export async function runSync(
  userId: string,
  connectionId: string,
  trigger: 'schedule' | 'manual',
): Promise<SyncResult> {
  // Single-flight lock.
  const locked = await redis.set(lockKey(connectionId), '1', 'EX', LOCK_TTL_SECONDS, 'NX');
  if (!locked) {
    logger.info({ connectionId }, 'sync already running — skipping');
    return { itemsFetched: 0, itemsPushed: 0, status: 'success' };
  }

  const run = await prisma.syncRun.create({
    data: { userId, connectionId, trigger, status: 'running', startedAt: new Date() },
  });

  let heldPlatform: PlatformName | null = null;
  let slotHeld = false;

  try {
    const connection = await prisma.connection.findFirst({
      where: { id: connectionId, userId, deletedAt: null },
      include: { secret: true },
    });
    if (!connection) throw new NotFoundError('Connection not found');
    if (!connection.secret) throw new ExpiredSessionError('No sync token — authorize first');

    // Best-effort per-platform concurrency cap.
    heldPlatform = connection.platform;
    slotHeld = await acquirePlatformSlot(connection.platform);

    const repo = await prisma.githubRepo.findUnique({
      where: { userId_platform: { userId, platform: connection.platform } },
    });
    if (!repo) throw new NotFoundError('No GitHub repo mapped for this platform');

    const oauth = await prisma.oAuthIdentity.findFirst({ where: { userId, provider: 'github' } });
    if (!oauth) throw new NotFoundError('No GitHub identity');

    // Decrypt secrets in-memory only.
    const platformToken = decrypt(connection.secret.tokenCipher, connection.secret.tokenIv);
    const githubToken = decrypt(oauth.accessTokenCipher, oauth.tokenIv);

    const adapter = getSubmissionAdapter(connection.platform);
    const submissions = await adapter.fetchAcceptedSubmissions(platformToken, connection.username);

    // Diff against already-synced problems (idempotency on slug).
    const existing = await prisma.problem.findMany({
      where: { userId, platform: connection.platform },
      select: { slug: true },
    });
    const known = new Set(existing.map((p) => p.slug));
    const fresh = submissions.filter((s) => !known.has(s.slug));

    const solutions: SolutionToSync[] = [];
    for (const sub of fresh) {
      try {
        const [code, question] = await Promise.all([
          adapter.fetchSubmissionCode(platformToken, sub),
          adapter.fetchQuestion(connection.username, sub.slug),
        ]);
        solutions.push({
          platform: connection.platform,
          number: sub.number,
          slug: sub.slug,
          title: sub.title,
          difficulty: sub.difficulty,
          topics: question.tags.length ? question.tags : sub.topics,
          language: sub.language,
          code,
          questionMarkdown: question.contentMarkdown,
          platformUrl: question.url,
          solvedAt: sub.solvedAt,
        });
      } catch (err) {
        logger.warn({ err, slug: sub.slug }, 'skipping problem (fetch failed)');
      }
    }

    let commitSha: string | undefined;
    if (solutions.length > 0) {
      commitSha = await publish(githubToken, repo, userId, connection.platform, solutions);
      await persist(userId, connectionId, connection.platform, solutions, repo.id);
    }

    const status = solutions.length === fresh.length ? 'success' : 'partial';
    await finishRun(run.id, userId, {
      itemsFetched: submissions.length,
      itemsPushed: solutions.length,
      status,
      commitSha,
    });
    return { itemsFetched: submissions.length, itemsPushed: solutions.length, status, commitSha };
  } catch (err) {
    if (err instanceof ExpiredSessionError) {
      await onExpired(run.id, connectionId, userId);
      return { itemsFetched: 0, itemsPushed: 0, status: 'expired' };
    }
    logger.error({ err, connectionId }, 'sync failed');
    await prisma.syncRun.update({
      where: { id: run.id },
      data: { status: 'failed', finishedAt: new Date(), errorCode: 'SYNC_FAILED' },
    });
    return { itemsFetched: 0, itemsPushed: 0, status: 'failed' };
  } finally {
    if (heldPlatform) await releasePlatformSlot(heldPlatform, slotHeld);
    await redis.del(lockKey(connectionId));
  }
}

/** Build the files (question.md + solution.<ext> per problem + README) and push one commit. */
async function publish(
  githubToken: string,
  repo: { repoFullName: string; defaultBranch: string },
  userId: string,
  platform: SolutionToSync['platform'],
  solutions: SolutionToSync[],
): Promise<string> {
  // Verify push access to the target repo BEFORE writing anything.
  await verifyRepoAccess(githubToken, repo.repoFullName);

  const files: GithubFile[] = [];
  for (const s of solutions) {
    const folder = padNumber(s.number);
    files.push({
      path: `${folder}/question.md`,
      content: `# ${s.title}\n\n${s.difficulty ? `**Difficulty:** ${s.difficulty}\n\n` : ''}**Topics:** ${s.topics.join(', ') || '—'}\n\n[View on platform](${s.platformUrl})\n\n---\n\n${s.questionMarkdown}\n`,
    });
    files.push({ path: `${folder}/solution.${langToExt(s.language)}`, content: s.code });
  }

  // Regenerate README from ALL problems (existing + new).
  const all = await prisma.problem.findMany({
    where: { userId, platform },
    select: { number: true, title: true, language: true, solutionPath: true },
  });
  const entries: RepoFileEntry[] = [
    ...all.map((p) => ({
      number: padNumber(p.number),
      title: p.title,
      language: p.language ?? 'txt',
      path: p.solutionPath ?? `${padNumber(p.number)}/`,
    })),
    ...solutions.map((s) => ({
      number: padNumber(s.number),
      title: s.title,
      language: s.language,
      path: `${padNumber(s.number)}/solution.${langToExt(s.language)}`,
    })),
  ];
  files.push({ path: 'README.md', content: generateReadme(repo.repoFullName.split('/')[1], entries) });

  return pushFiles(
    githubToken,
    repo.repoFullName,
    repo.defaultBranch,
    files,
    `chore: sync ${solutions.length} solution(s) from ${platform} via CodeVault`,
  );
}

/** Upsert problems + bump denormalized counts. */
async function persist(
  userId: string,
  connectionId: string,
  platform: SolutionToSync['platform'],
  solutions: SolutionToSync[],
  repoId: string,
): Promise<void> {
  for (const s of solutions) {
    const solutionPath = `${padNumber(s.number)}/solution.${langToExt(s.language)}`;
    await prisma.problem.upsert({
      where: { userId_platform_slug: { userId, platform, slug: s.slug } },
      create: {
        userId,
        connectionId,
        platform,
        number: s.number,
        slug: s.slug,
        title: s.title,
        difficulty: s.difficulty,
        topics: s.topics,
        language: s.language,
        solutionPath,
        solvedAt: s.solvedAt ? new Date(s.solvedAt) : undefined,
        syncedToGit: true,
        syncedAt: new Date(),
      },
      update: { syncedToGit: true, syncedAt: new Date(), solutionPath },
    });
  }
  const count = await prisma.problem.count({ where: { userId, platform } });
  await prisma.connection.update({
    where: { id: connectionId },
    data: { lastSyncedAt: new Date(), solvedCount: count },
  });
  await prisma.githubRepo.update({
    where: { id: repoId },
    data: { fileCount: count, lastSyncAt: new Date() },
  });
}

async function finishRun(
  runId: string,
  userId: string,
  result: SyncResult,
): Promise<void> {
  await prisma.syncRun.update({
    where: { id: runId },
    data: {
      status: result.status,
      itemsFetched: result.itemsFetched,
      itemsPushed: result.itemsPushed,
      finishedAt: new Date(),
    },
  });
  if (result.itemsPushed > 0) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'sync',
        title: 'Sync complete',
        body: `${result.itemsPushed} solution(s) pushed to GitHub.`,
      },
    });
  }
}

async function onExpired(runId: string, connectionId: string, userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.syncRun.update({
      where: { id: runId },
      data: { status: 'expired', finishedAt: new Date(), errorCode: 'SESSION_EXPIRED' },
    }),
    prisma.connection.update({ where: { id: connectionId }, data: { tokenStatus: 'expired' } }),
    prisma.notification.create({
      data: {
        userId,
        type: 'expiry',
        title: 'Session expired',
        body: 'Reconnect the platform to resume code sync.',
      },
    }),
  ]);
}
