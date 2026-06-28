import prisma from '../lib/prisma';
import { PlatformType } from '@prisma/client';
import logger from '../lib/logger';

export class ConnectionService {
  static async addConnection(userId: string, platform: PlatformType, username: string) {
    try {
      const existing = await prisma.connection.findUnique({
        where: { userId_platform: { userId, platform } }
      });

      if (existing) {
        throw new Error(`Already connected to ${platform}`);
      }

      const connection = await prisma.connection.create({
        data: {
          userId,
          platform,
          username,
        }
      });

      return connection;
    } catch (error: any) {
      logger.error({ err: error.message }, `Failed to add connection for ${platform}`);
      throw error;
    }
  }

  static async listConnections(userId: string) {
    return prisma.connection.findMany({
      where: { userId },
      select: {
        id: true,
        platform: true,
        username: true,
        syncEnabled: true,
        tokenStatus: true,
        solvedCount: true,
        lastSyncedAt: true,
      }
    });
  }

  static async removeConnection(userId: string, platform: PlatformType) {
    await prisma.connection.deleteMany({
      where: { userId, platform }
    });
  }
}
