import axios from 'axios';
import logger from '../../lib/logger';

export class CodeforcesService {
  static async getStats(username: string) {
    try {
      const statusRes = await axios.get(`https://codeforces.com/api/user.status?handle=${username}`);
      const ratingRes = await axios.get(`https://codeforces.com/api/user.rating?handle=${username}`).catch(() => null);
      
      if (statusRes.data.status !== 'OK') return null;

      const submissions = statusRes.data.result;
      const ratingHistory = ratingRes?.data?.status === 'OK' ? ratingRes.data.result : [];

      const solved = new Set();
      const heatmap: Record<string, number> = {};
      const languages: Record<string, number> = {};
      const topics: Record<string, number> = {};
      const recent: any[] = [];
      
      submissions.forEach((sub: any) => {
        if (sub.verdict === 'OK') {
          const probId = `${sub.problem.contestId}-${sub.problem.index}`;
          
          if (!solved.has(probId)) {
            solved.add(probId);
            
            const lang = sub.programmingLanguage;
            languages[lang] = (languages[lang] || 0) + 1;
            
            sub.problem.tags?.forEach((tag: string) => {
              topics[tag] = (topics[tag] || 0) + 1;
            });
            
            if (recent.length < 15) {
              recent.push({
                title: `${sub.problem.contestId}${sub.problem.index} - ${sub.problem.name}`,
                titleSlug: probId,
                timestamp: sub.creationTimeSeconds,
                rating: sub.problem.rating
              });
            }
          }
          
          const ts = sub.creationTimeSeconds;
          // Group by timestamp for heatmap
          heatmap[ts.toString()] = (heatmap[ts.toString()] || 0) + 1;
        }
      });

      return {
        total: solved.size,
        heatmap,
        languages,
        topics,
        recent,
        ratingHistory
      };
    } catch (error) {
      logger.error({ username }, 'Failed to fetch deep Codeforces stats');
      return null;
    }
  }
}
