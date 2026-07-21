import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { CodeforcesService } from '../codeforces';

vi.mock('axios');
vi.mock('../../../lib/redis', () => ({
  redis: { get: vi.fn().mockResolvedValue(null), setex: vi.fn().mockResolvedValue('OK') },
}));

const mockedAxios = vi.mocked(axios, true);

function sub(contestId: number, index: string, verdict = 'OK', lang = 'GNU C++', tags: string[] = ['dp']) {
  return {
    verdict,
    programmingLanguage: lang,
    creationTimeSeconds: 1700000000,
    problem: { contestId, index, name: 'Prob', tags, rating: 1500 },
  };
}

describe('CodeforcesService.getStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('dedupes solved problems and aggregates languages/topics', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('user.status')) {
        return Promise.resolve({
          data: { status: 'OK', result: [sub(1, 'A'), sub(1, 'A'), sub(2, 'B')] },
        } as any);
      }
      return Promise.resolve({ data: { status: 'OK', result: [] } } as any);
    });

    const stats = await CodeforcesService.getStats('bob');

    expect(stats).not.toBeNull();
    expect(stats!.total).toBe(2); // 1-A counted once
    expect(stats!.languages['GNU C++']).toBe(2);
    expect(stats!.topics['dp']).toBe(2);
  });

  it('sends an 8s timeout on the status request', async () => {
    mockedAxios.get.mockResolvedValue({ data: { status: 'OK', result: [] } } as any);
    await CodeforcesService.getStats('bob');
    const statusCall = mockedAxios.get.mock.calls.find((c) => String(c[0]).includes('user.status'));
    expect((statusCall?.[1] as any)?.timeout).toBe(8000);
  });

  it('returns null when the API reports a non-OK status', async () => {
    mockedAxios.get.mockResolvedValue({ data: { status: 'FAILED' } } as any);
    expect(await CodeforcesService.getStats('ghost')).toBeNull();
  });

  it('returns null (never throws) on network failure', async () => {
    mockedAxios.get.mockRejectedValue(new Error('ECONNRESET'));
    expect(await CodeforcesService.getStats('bob')).toBeNull();
  });
});
