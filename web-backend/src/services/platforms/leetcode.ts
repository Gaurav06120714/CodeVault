import axios from 'axios';
import logger from '../../lib/logger';

export class LeetCodeService {
  static async getStats(username: string) {
    try {
      const query = `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            submitStats: submitStatsGlobal {
              acSubmissionNum { difficulty count }
            }
            languageProblemCount { languageName problemsSolved }
            tagProblemCounts {
              advanced { tagName problemsSolved }
              intermediate { tagName problemsSolved }
              fundamental { tagName problemsSolved }
            }
          }
          matchedUserCalendar: matchedUser(username: $username) {
            userCalendar { submissionCalendar }
          }
          recentAcSubmissionList(username: $username, limit: 15) {
            title
            titleSlug
            timestamp
          }
        }
      `;

      const response = await axios.post('https://leetcode.com/graphql', {
        query,
        variables: { username }
      });

      const data = response.data?.data;
      if (!data || !data.matchedUser) return null;

      const diff = data.matchedUser.submitStats?.acSubmissionNum || [];
      const stats = {
        easy: diff.find((d: any) => d.difficulty === 'Easy')?.count || 0,
        medium: diff.find((d: any) => d.difficulty === 'Medium')?.count || 0,
        hard: diff.find((d: any) => d.difficulty === 'Hard')?.count || 0,
        total: diff.find((d: any) => d.difficulty === 'All')?.count || 0,
        
        languages: data.matchedUser.languageProblemCount || [],
        topics: data.matchedUser.tagProblemCounts || {},
        heatmap: data.matchedUserCalendar?.userCalendar?.submissionCalendar || "{}",
        recent: data.recentAcSubmissionList || []
      };

      return stats;
    } catch (error) {
      logger.error({ username }, 'Failed to fetch deep LeetCode stats');
      return null;
    }
  }
}
