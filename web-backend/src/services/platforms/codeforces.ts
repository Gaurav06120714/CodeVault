import axios from 'axios';
import logger from '../../lib/logger';

export class CodeforcesService {
  static async getStats(username: string) {
    try {
      const response = await axios.get(`https://codeforces.com/api/user.status?handle=${username}`);
      
      if (response.data.status !== 'OK') return null;

      const submissions = response.data.result;
      const solved = new Set();
      
      submissions.forEach((sub: any) => {
        if (sub.verdict === 'OK') {
          solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
        }
      });

      return {
        total: solved.size
      };
    } catch (error) {
      logger.error({ username }, 'Failed to fetch Codeforces stats');
      return null;
    }
  }
}
