import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';
import { getStatsProvider } from './platforms';
import type { AggregatedStats, PlatformName } from '../types';
import type { PlatformStats } from '../types/platform.types';

const CACHE_TTL_SECONDS = 600; // 10 minutes (PLATFORM_INTEGRATION §7)
const cacheKey = (userId: string, platform: PlatformName) => `stats:${userId}:${platform}`;

/** Fetch one platform's stats: Redis cache -> live provider -> snapshot fallback. */
async function fetchPlatform(
  userId: string,
  platform: PlatformName,
  username: string,
): Promise<PlatformStats | null> {
  const key = cacheKey(userId, platform);

  const cached = await redis.get(key).catch(() => null);
  if (cached) return JSON.parse(cached) as PlatformStats;

  try {
    const stats = await getStatsProvider(platform).fetchStats(username);
    await redis.set(key, JSON.stringify(stats), 'EX', CACHE_TTL_SECONDS).catch(() => undefined);
    await prisma.statsSnapshot.upsert({
      where: { userId_platform: { userId, platform } },
      create: { userId, platform, payload: stats as unknown as object },
      update: { payload: stats as unknown as object, fetchedAt: new Date() },
    });
    return stats;
  } catch (err) {
    logger.warn({ err, platform, username }, 'platform stats fetch failed — trying snapshot');
    const snapshot = await prisma.statsSnapshot.findUnique({
      where: { userId_platform: { userId, platform } },
    });
    return snapshot ? (snapshot.payload as unknown as PlatformStats) : null;
  }
}

/** Aggregate every connected platform into the unified dashboard stats. */
export async function getAggregatedStats(userId: string): Promise<AggregatedStats> {
  const connections = await prisma.connection.findMany({
    where: { userId, deletedAt: null },
    select: { platform: true, username: true },
  });

  const results = await Promise.all(
    connections.map(async (c) => ({
      platform: c.platform,
      stats: await fetchPlatform(userId, c.platform, c.username),
    })),
  );

  const stats: AggregatedStats = {
    totalSolved: 0,
    byDifficulty: { easy: 0, medium: 0, hard: 0 },
    byPlatform: [],
    byTopic: [],
    byLanguage: [],
    streak: { current: 0, longest: 0 },
    ratings: [],
    heatmap: [],
    syncedToGit: { count: 0, pct: 0 },
    degraded: [],
  };

  const topicTotals = new Map<string, number>();
  const langTotals = new Map<string, number>();

  for (const { platform, stats: ps } of results) {
    if (!ps) {
      stats.degraded.push(platform);
      continue;
    }
    stats.totalSolved += ps.totalSolved;
    stats.byDifficulty.easy += ps.byDifficulty.easy;
    stats.byDifficulty.medium += ps.byDifficulty.medium;
    stats.byDifficulty.hard += ps.byDifficulty.hard;
    stats.byPlatform.push({ platform, solved: ps.totalSolved, pct: 0 });
    for (const t of ps.topics) topicTotals.set(t.name, (topicTotals.get(t.name) ?? 0) + t.count);
    for (const l of ps.languages) langTotals.set(l.name, (langTotals.get(l.name) ?? 0) + l.count);
    if (ps.rating) stats.ratings.push({ platform, current: ps.rating.current, peak: ps.rating.peak });
    if (ps.streak) {
      stats.streak.current = Math.max(stats.streak.current, ps.streak.current);
      stats.streak.longest = Math.max(stats.streak.longest, ps.streak.longest);
    }
  }

  // Percentages + top-N rollups.
  stats.byPlatform.forEach((p) => {
    p.pct = stats.totalSolved ? Math.round((p.solved / stats.totalSolved) * 100) : 0;
  });
  stats.byTopic = [...topicTotals.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
  stats.byLanguage = [...langTotals.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Sync progress from the problems table (git-service owned).
  const [synced, total] = await Promise.all([
    prisma.problem.count({ where: { userId, syncedToGit: true } }),
    prisma.problem.count({ where: { userId } }),
  ]);
  stats.syncedToGit = { count: synced, pct: total ? Math.round((synced / total) * 100) : 0 };

  return stats;
}
