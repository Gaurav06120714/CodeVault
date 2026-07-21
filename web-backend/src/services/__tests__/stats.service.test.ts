import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/redis', () => ({
  redis: { get: vi.fn(), setex: vi.fn().mockResolvedValue('OK') },
}));
vi.mock('../connection.service', () => ({
  ConnectionService: { listConnections: vi.fn() },
}));
vi.mock('../platforms/leetcode', () => ({ LeetCodeService: { getStats: vi.fn() } }));
vi.mock('../platforms/codeforces', () => ({ CodeforcesService: { getStats: vi.fn() } }));
vi.mock('../platforms/codechef.service', () => ({ CodeChefService: { getStats: vi.fn() } }));
vi.mock('../platforms/hackerrank.service', () => ({ HackerRankService: { getStats: vi.fn() } }));

import { StatsService } from '../stats.service';
import { redis } from '../../lib/redis';
import { ConnectionService } from '../connection.service';
import { LeetCodeService } from '../platforms/leetcode';

// Each test uses a unique userId so the in-process L1 memory cache never leaks between cases.
let seq = 0;
const nextUser = () => `user-${seq++}`;

describe('StatsService.getAggregatedStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the Redis aggregate cache without hitting platforms when warm', async () => {
    const userId = nextUser();
    const cached = { totalSolved: 999, platforms: { leetcode: { total: 999 } } };
    vi.mocked(redis.get).mockResolvedValueOnce(JSON.stringify(cached));

    const result = await StatsService.getAggregatedStats(userId);

    expect(result).toEqual(cached);
    expect(ConnectionService.listConnections).not.toHaveBeenCalled();
    expect(LeetCodeService.getStats).not.toHaveBeenCalled();
  });

  it('live-fetches connected platforms and sums totalSolved on a cold cache', async () => {
    const userId = nextUser();
    vi.mocked(redis.get).mockResolvedValue(null); // aggregate + per-platform caches all cold
    vi.mocked(ConnectionService.listConnections).mockResolvedValueOnce([
      { platform: 'leetcode', username: 'alice' },
    ] as any);
    vi.mocked(LeetCodeService.getStats).mockResolvedValueOnce({ total: 42 } as any);

    const result = await StatsService.getAggregatedStats(userId);

    expect(LeetCodeService.getStats).toHaveBeenCalledWith('alice');
    expect(result.totalSolved).toBe(42);
    expect(result.platforms.leetcode).toEqual({ total: 42 });
    // aggregate result is written back to Redis for the next request
    expect(redis.setex).toHaveBeenCalled();
  });

  it('serves the in-memory L1 cache on an immediate second call (no second live fetch)', async () => {
    const userId = nextUser();
    vi.mocked(redis.get).mockResolvedValue(null);
    vi.mocked(ConnectionService.listConnections).mockResolvedValue([
      { platform: 'leetcode', username: 'alice' },
    ] as any);
    vi.mocked(LeetCodeService.getStats).mockResolvedValue({ total: 7 } as any);

    await StatsService.getAggregatedStats(userId);
    vi.mocked(ConnectionService.listConnections).mockClear();
    const second = await StatsService.getAggregatedStats(userId);

    expect(second.totalSolved).toBe(7);
    expect(ConnectionService.listConnections).not.toHaveBeenCalled(); // served from L1
  });
});
