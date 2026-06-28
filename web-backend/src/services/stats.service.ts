import { ConnectionService } from './connection.service';
import { LeetCodeService } from './platforms/leetcode';
import { CodeforcesService } from './platforms/codeforces';
import { redis } from '../lib/redis';
import { PlatformType } from '@prisma/client';
import logger from '../lib/logger';

export class StatsService {
  static async getAggregatedStats(userId: string) {
    const cacheKey = `stats:${userId}`;
    
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn('Redis cache read failed for stats');
    }

    const connections = await ConnectionService.listConnections(userId);
    
    const aggregated = {
      totalSolved: 0,
      platforms: {} as any
    };

    for (const conn of connections) {
      if (conn.platform === PlatformType.leetcode) {
        const stats = await LeetCodeService.getStats(conn.username);
        if (stats) {
          aggregated.platforms.leetcode = stats;
          aggregated.totalSolved += stats.total;
        }
      } else if (conn.platform === PlatformType.codeforces) {
        const stats = await CodeforcesService.getStats(conn.username);
        if (stats) {
          aggregated.platforms.codeforces = stats;
          aggregated.totalSolved += stats.total;
        }
      }
    }

    try {
      await redis.setex(cacheKey, 600, JSON.stringify(aggregated)); // Cache for 10 mins
    } catch (err) {
      logger.warn('Redis cache write failed for stats');
    }

    return aggregated;
  }
}
