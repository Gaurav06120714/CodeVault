import prisma from '../lib/prisma';
import { PlatformType } from '@prisma/client';
import logger from '../lib/logger';
import { encryptToken } from '../lib/crypto';

export class ConnectionService {
  static async addConnection(userId: string, platform: PlatformType, username: string, sessionToken?: string) {
    try {
      const connection = await prisma.$transaction(async (tx) => {
        // Upsert the connection (allow updating username/sync status)
        const conn = await tx.connection.upsert({
          where: { userId_platform: { userId, platform } },
          update: {
            username,
            syncEnabled: !!sessionToken,
            tokenStatus: sessionToken ? 'active' : 'none',
          },
          create: {
            userId,
            platform,
            username,
            syncEnabled: !!sessionToken,
            tokenStatus: sessionToken ? 'active' : 'none',
          }
        });

        if (sessionToken) {
          const { cipher, iv } = encryptToken(sessionToken);
          // Upsert the secret
          await tx.connectionSecret.upsert({
            where: { connectionId: conn.id },
            update: {
              tokenCipher: cipher,
              tokenIv: iv,
            },
            create: {
              connectionId: conn.id,
              tokenCipher: cipher,
              tokenIv: iv,
            }
          });
        }

        return conn;
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
