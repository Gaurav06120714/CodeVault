import logger from '../../lib/logger';
import { UpstreamError } from '../../utils/errors';
import type { Question, Submission, SubmissionAdapter } from '../../types/sync.types';

// HackerRank exposes no official authorized API for a user's source code; the internal
// endpoints are unstable and gated. Path B code-sync degrades here. Stats (Path A) come
// from the public profile/badges in web-backend.
export const hackerrankSubmissionAdapter: SubmissionAdapter = {
  platform: 'hackerrank',
  supportsCodeSync: false,

  async getRecentSubmissions(_token, _opts): Promise<Submission[]> {
    logger.warn('HackerRank code-sync is not supported (no authorized code API); skipping.');
    return [];
  },

  async getQuestion(slug): Promise<Question> {
    if (!slug) throw new UpstreamError('HackerRank challenge slug is required');
    const url = `https://www.hackerrank.com/challenges/${slug}/problem`;
    return {
      slug,
      number: slug,
      title: slug,
      topics: [],
      statementMarkdown: `Problem statement not available via API. See ${url}`,
      url,
    };
  },
};
