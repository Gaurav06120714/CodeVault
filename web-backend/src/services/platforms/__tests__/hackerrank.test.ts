import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { HackerRankService } from '../hackerrank.service';

vi.mock('axios');
vi.mock('../../../lib/redis', () => ({
  redis: { get: vi.fn().mockResolvedValue(null), setex: vi.fn().mockResolvedValue('OK') },
}));

const mockedAxios = vi.mocked(axios, true);

describe('HackerRankService.getStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sums solved counts from badges and builds a track breakdown', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/badges')) {
        return Promise.resolve({
          data: {
            models: [
              { badge_name: 'Problem Solving', solved: 120, hacker_rank: 5000 },
              { badge_name: 'Python', solved: 30, hacker_rank: 900 },
              { badge_name: 'Empty', solved: 0 },
            ],
          },
        } as any);
      }
      return Promise.resolve({ data: { models: [] } } as any); // recent_challenges
    });

    const stats = await HackerRankService.getStats('carol');

    expect(stats).not.toBeNull();
    expect(stats!.total).toBe(150);
    expect(stats!.tracks).toHaveLength(2); // the 0-solved badge is excluded
    expect(stats!.tracks[0].name).toBe('Problem Solving'); // sorted desc by solved
  });

  it('returns null when the badges payload has no models', async () => {
    mockedAxios.get.mockResolvedValue({ data: {} } as any);
    expect(await HackerRankService.getStats('ghost')).toBeNull();
  });

  it('returns null (never throws) on request failure', async () => {
    mockedAxios.get.mockRejectedValue(new Error('ECONNREFUSED'));
    expect(await HackerRankService.getStats('carol')).toBeNull();
  });
});
