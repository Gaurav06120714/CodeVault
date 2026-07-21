import axios from 'axios';
import { OAuthProvider } from '@prisma/client';
import prisma from '../lib/prisma';
import logger from '../lib/logger';
import { env } from '../config/env';
import { decryptToken } from '../lib/crypto';

export interface UserSettingsPayload {
  displayName?: string;
  handle?: string;
  publicProfileEnabled?: boolean;
  settings?: any; // The JSON blob
}

export class SettingsService {
  static async getSettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        handle: true,
        displayName: true,
        email: true,
        githubLogin: true,
        publicProfileEnabled: true,
        settings: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  static async updateSettings(userId: string, data: UserSettingsPayload) {
    // Basic validation for handle if it's being updated
    if (data.handle !== undefined) {
      const handleRegex = /^[a-zA-Z0-9-]+$/;
      if (!handleRegex.test(data.handle)) {
        throw new Error('Handle can only contain alphanumeric characters and dashes');
      }

      // Check for uniqueness
      const existing = await prisma.user.findUnique({ where: { handle: data.handle } });
      if (existing && existing.id !== userId) {
        throw new Error('Handle is already taken');
      }
    }

    // Since settings is a JSON blob, we want to deep merge it, 
    // but Prisma doesn't support deep JSON merge easily in an update.
    // So we fetch the current settings first if we need to update it.
    let mergedSettings = undefined;
    if (data.settings !== undefined) {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { settings: true },
      });
      const currentSettings = (currentUser?.settings as any) || {};
      
      // Simple shallow merge for top-level keys in the settings JSON 
      // (like sync, notifications, appearance)
      mergedSettings = {
        ...currentSettings,
        ...data.settings
      };
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.handle !== undefined && { handle: data.handle }),
        ...(data.publicProfileEnabled !== undefined && { publicProfileEnabled: data.publicProfileEnabled }),
        ...(mergedSettings !== undefined && { settings: mergedSettings }),
      },
      select: {
        id: true,
        handle: true,
        displayName: true,
        email: true,
        githubLogin: true,
        publicProfileEnabled: true,
        settings: true,
      },
    });

    return updatedUser;
  }

  /**
   * GDPR data portability — return everything we hold about the user as JSON.
   * Deliberately excludes secrets: connection session tokens (encrypted) and any
   * OAuth token ciphertext are never included in an export.
   */
  static async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        handle: true,
        displayName: true,
        email: true,
        githubLogin: true,
        avatarUrl: true,
        plan: true,
        publicProfileEnabled: true,
        settings: true,
        createdAt: true,
        connections: {
          select: { platform: true, username: true, syncEnabled: true, tokenStatus: true, createdAt: true },
        },
      },
    });
    if (!user) throw new Error('User not found');
    return { exportedAt: new Date().toISOString(), user };
  }

  /**
   * Right-to-erasure — permanently delete the account. The schema declares
   * onDelete: Cascade on every user relation, so this purges connections AND
   * their ConnectionSecret rows (the encrypted platform/GitHub tokens), plus
   * notifications, follows, messages, sync runs, etc.
   */
  static async deleteAccount(userId: string) {
    await this.revokeGithubGrant(userId); // best-effort; must not block deletion
    await prisma.user.delete({ where: { id: userId } });
    logger.warn({ userId }, 'Account deleted — all user data and tokens purged');
  }

  /**
   * Ask GitHub to revoke our OAuth grant so the (soon-deleted) user's token can
   * no longer be used. Best-effort: any failure is logged and swallowed so the
   * DB deletion (which itself purges the encrypted token) always proceeds.
   */
  private static async revokeGithubGrant(userId: string) {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) return;
    try {
      const identity = await prisma.oAuthIdentity.findFirst({
        where: { userId, provider: OAuthProvider.github },
        select: { accessTokenCipher: true, tokenIv: true },
      });
      if (!identity) return;

      const token = decryptToken(Buffer.from(identity.accessTokenCipher), Buffer.from(identity.tokenIv));
      await axios.delete(`https://api.github.com/applications/${env.GITHUB_CLIENT_ID}/grant`, {
        auth: { username: env.GITHUB_CLIENT_ID, password: env.GITHUB_CLIENT_SECRET },
        data: { access_token: token },
        headers: { Accept: 'application/vnd.github+json' },
        timeout: 8000,
      });
      logger.info({ userId }, 'Revoked GitHub OAuth grant on account deletion');
    } catch (err: any) {
      logger.warn({ userId, err: err?.message }, 'GitHub token revoke failed (continuing with deletion)');
    }
  }
}
