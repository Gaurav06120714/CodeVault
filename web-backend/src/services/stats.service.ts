import { ConnectionService } from './connection.service';
import { LeetCodeService } from './platforms/leetcode';
import { CodeforcesService } from './platforms/codeforces';
import { CodeChefService } from './platforms/codechef.service';
import { HackerRankService } from './platforms/hackerrank.service';
import { redis } from '../lib/redis';
import { PlatformType } from '@prisma/client';
import logger from '../lib/logger';

const memoryCache = new Map<string, { data: any, expires: number }>();

export class StatsService {
  static async getAggregatedStats(userId: string) {
    const startTime = Date.now();
    console.log(`[StatsService] getAggregatedStats called for ${userId}`);
    const cacheKey = `stats:${userId}`;
    
    // Check in-memory cache first
    const mem = memoryCache.get(cacheKey);
    if (mem && mem.expires > Date.now()) {
      console.log(`[StatsService] Memory cache HIT! Returned in ${Date.now() - startTime}ms`);
      return mem.data;
    }
    console.log(`[StatsService] Memory cache MISS.`);

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        memoryCache.set(cacheKey, { data, expires: Date.now() + 600000 });
        return data;
      }
    } catch (err) {
      logger.warn('Redis cache read failed for stats');
    }

    const connections = await ConnectionService.listConnections(userId);
    
    const aggregated = {
      totalSolved: 0,
      platforms: {} as any
    };

    // Fetch all platforms concurrently
    await Promise.all(connections.map(async (conn) => {
      let stats = null;
      if (conn.platform === PlatformType.leetcode) {
        stats = await LeetCodeService.getStats(conn.username);
      } else if (conn.platform === PlatformType.codeforces) {
        stats = await CodeforcesService.getStats(conn.username);
      } else if (conn.platform === PlatformType.codechef) {
        stats = await CodeChefService.getStats(conn.username);
      } else if (conn.platform === PlatformType.hackerrank) {
        stats = await HackerRankService.getStats(conn.username);
      }

      if (stats) {
        aggregated.platforms[conn.platform] = stats;
      }
    }));

    // Recalculate total solved after all promises resolve
    for (const p of Object.values(aggregated.platforms)) {
      aggregated.totalSolved += (p as any).total || 0;
    }

    memoryCache.set(cacheKey, { data: aggregated, expires: Date.now() + 600000 }); // 10 min

    try {
      await redis.setex(cacheKey, 600, JSON.stringify(aggregated)); // Cache for 10 mins
    } catch (err) {
      logger.warn('Redis cache write failed for stats');
    }

    console.log(`[StatsService] Completed scrape. Total time: ${Date.now() - startTime}ms`);
    return aggregated;
  }
}

