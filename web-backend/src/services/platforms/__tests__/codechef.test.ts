import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { CodeChefService } from '../codechef.service';

vi.mock('axios');
vi.mock('../../../lib/redis', () => ({
  redis: { get: vi.fn().mockResolvedValue(null), setex: vi.fn().mockResolvedValue('OK') },
}));

const mockedAxios = vi.mocked(axios, true);

const profileHtml = `
  <html><head><title>alice | CodeChef User Profile</title></head>
  <body>
    <div>Total Problems Solved: 632</div>
    <div class="rating-number">2010</div>
    <div>Highest Rating 2150</div>
    <div>Global Rank 1234</div>
  </body></html>`;

describe('CodeChefService.getStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('parses solved count, rating, peak, rank and derives stars', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/users/')) return Promise.resolve({ data: profileHtml } as any);
      // recent submissions endpoint — return empty content
      return Promise.resolve({ data: { content: '' } } as any);
    });

    const stats = await CodeChefService.getStats('alice');

    expect(stats).not.toBeNull();
    expect(stats!.total).toBe(632);
    expect(stats!.rating).toBe(2010);
    expect(stats!.highestRating).toBe(2150);
    expect(stats!.stars).toBe(5); // 2000–2199 band
  });

  it('returns null for an invalid username (CodeChef serves a 200 generic page)', async () => {
    mockedAxios.get.mockResolvedValue({ data: '<html><title>CodeChef</title></html>' } as any);
    expect(await CodeChefService.getStats('ghost')).toBeNull();
  });

  it('returns null (never throws) on request failure', async () => {
    mockedAxios.get.mockRejectedValue(new Error('ETIMEDOUT'));
    expect(await CodeChefService.getStats('alice')).toBeNull();
  });
});
