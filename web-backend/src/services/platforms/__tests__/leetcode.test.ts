import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { LeetCodeService } from '../leetcode';

vi.mock('axios');
const mockedAxios = vi.mocked(axios, true);

const validResponse = {
  data: {
    data: {
      matchedUser: {
        submitStats: {
          acSubmissionNum: [
            { difficulty: 'All', count: 100 },
            { difficulty: 'Easy', count: 40 },
            { difficulty: 'Medium', count: 45 },
            { difficulty: 'Hard', count: 15 },
          ],
        },
        languageProblemCount: [{ languageName: 'TypeScript', problemsSolved: 50 }],
        tagProblemCounts: { advanced: [], intermediate: [], fundamental: [] },
      },
      matchedUserCalendar: { userCalendar: { submissionCalendar: '{"1700000000":3}' } },
      recentAcSubmissionList: [{ title: 'Two Sum', titleSlug: 'two-sum', timestamp: '1700000000', topicTags: [] }],
    },
  },
};

describe('LeetCodeService.getStats', () => {
  beforeEach(() => vi.clearAllMocks());

  it('parses difficulty counts, languages, topics, heatmap and recent', async () => {
    mockedAxios.post.mockResolvedValueOnce(validResponse as any);

    const stats = await LeetCodeService.getStats('alice');

    expect(stats).not.toBeNull();
    expect(stats!.total).toBe(100);
    expect(stats!.easy).toBe(40);
    expect(stats!.medium).toBe(45);
    expect(stats!.hard).toBe(15);
    expect(stats!.languages).toHaveLength(1);
    expect(stats!.heatmap).toBe('{"1700000000":3}');
    expect(stats!.recent).toHaveLength(1);
  });

  it('sends an 8s timeout so a slow LeetCode cannot hang the dashboard', async () => {
    mockedAxios.post.mockResolvedValueOnce(validResponse as any);

    await LeetCodeService.getStats('alice');

    const [, , config] = mockedAxios.post.mock.calls[0];
    expect((config as any)?.timeout).toBe(8000);
  });

  it('returns null when the user does not exist (no matchedUser)', async () => {
    mockedAxios.post.mockResolvedValueOnce({ data: { data: { matchedUser: null } } } as any);
    expect(await LeetCodeService.getStats('ghost')).toBeNull();
  });

  it('returns null (never throws) when the request fails', async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error('ETIMEDOUT'));
    expect(await LeetCodeService.getStats('alice')).toBeNull();
  });
});
