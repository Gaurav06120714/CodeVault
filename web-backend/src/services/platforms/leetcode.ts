import axios from 'axios';
import logger from '../../lib/logger';

export class LeetCodeService {
  static async getStats(username: string) {
    try {
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats: submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
          }
        }
      `;

      const response = await axios.post('https://leetcode.com/graphql', {
        query,
        variables: { username }
      });

      const data = response.data?.data?.matchedUser?.submitStats?.acSubmissionNum;
      if (!data) return null;

      const stats = {
        easy: data.find((d: any) => d.difficulty === 'Easy')?.count || 0,
        medium: data.find((d: any) => d.difficulty === 'Medium')?.count || 0,
        hard: data.find((d: any) => d.difficulty === 'Hard')?.count || 0,
        total: data.find((d: any) => d.difficulty === 'All')?.count || 0,
      };

      return stats;
    } catch (error) {
      logger.error({ username }, 'Failed to fetch LeetCode stats');
      return null;
    }
  }
}
