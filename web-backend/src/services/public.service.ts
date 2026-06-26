import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import { NotFoundError } from '../utils/errors';
import { getAggregatedStats } from './stats.service';
import type { PublicProfile } from '../types';

const CACHE_TTL_SECONDS = 900; // 15 min (enumeration + scraping defense via cache)
const cacheKey = (handle: string) => `public:${handle.toLowerCase()}`;

/**
 * Build a shareable public profile by handle. Returns a UNIFORM 404 for
 * missing, deleted, or private profiles — no enumeration oracle. Never exposes
 * email or tokens (only public-safe fields). See SECURITY_PLAN §4 / API_CONTRACT 1.5.
 */
export async function getPublicProfile(handle: string): Promise<PublicProfile> {
  const key = cacheKey(handle);
  const cached = await redis.get(key).catch(() => null);
  if (cached) return JSON.parse(cached) as PublicProfile;

  const user = await prisma.user.findFirst({
    where: { handle: handle.toLowerCase(), publicProfileEnabled: true, deletedAt: null },
    select: { id: true, handle: true, displayName: true, avatarUrl: true },
  });
  if (!user) throw new NotFoundError('Profile not found');

  const stats = await getAggregatedStats(user.id);

  const profile: PublicProfile = {
    handle: user.handle,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    totalSolved: stats.totalSolved,
    byDifficulty: stats.byDifficulty,
    byPlatform: stats.byPlatform,
    byTopic: stats.byTopic,
    byLanguage: stats.byLanguage,
    ratings: stats.ratings,
    bestStreak: stats.streak.longest,
  };

  await redis.set(key, JSON.stringify(profile), 'EX', CACHE_TTL_SECONDS).catch(() => undefined);
  return profile;
}
