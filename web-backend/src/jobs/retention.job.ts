import prisma from '../lib/prisma';
import logger from '../lib/logger';

/**
 * Data retention policy for CodeVault.
 *
 * Runs daily at 02:00 UTC (scheduled in server.ts via node-cron).
 * Cleans up stale/inactive data to prevent unbounded PostgreSQL growth:
 *
 *  1. Notifications  — delete rows older than 90 days (all users)
 *  2. AuthSessions   — delete expired or revoked sessions older than 30 days
 *  3. AuditLogs      — delete rows older than 180 days
 *  4. StatsSnapshots — delete snapshot rows for users inactive for > 90 days
 *                      (snapshots are re-created on next login; no data is lost)
 *  5. GDPR erasure   — hard-delete User rows soft-deleted more than 30 days ago
 *                      (cascades to all child tables via Prisma schema OnDelete: Cascade)
 */
export async function runRetentionJob(): Promise<void> {
  const start = Date.now();
  logger.info('[RetentionJob] Starting daily data-retention sweep');

  // ─── 1. Notifications older than 90 days ─────────────────────────────────
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  try {
    const { count: notifCount } = await prisma.notification.deleteMany({
      where: { createdAt: { lt: ninetyDaysAgo } },
    });
    logger.info(`[RetentionJob] Deleted ${notifCount} notifications older than 90 days`);
  } catch (err) {
    logger.error({ err }, '[RetentionJob] Failed to purge old notifications');
  }

  // ─── 2. Expired / revoked AuthSessions older than 30 days ────────────────
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  try {
    const { count: sessionCount } = await prisma.authSession.deleteMany({
      where: {
        OR: [
          // Session token has naturally expired AND was last seen > 30 days ago
          { expiresAt: { lt: thirtyDaysAgo } },
          // Session was explicitly revoked > 30 days ago
          { revokedAt: { not: null, lt: thirtyDaysAgo } },
        ],
      },
    });
    logger.info(`[RetentionJob] Deleted ${sessionCount} stale auth sessions`);
  } catch (err) {
    logger.error({ err }, '[RetentionJob] Failed to purge stale auth sessions');
  }

  // ─── 3. AuditLogs older than 180 days ────────────────────────────────────
  const oneEightyDaysAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  try {
    const { count: auditCount } = await prisma.auditLog.deleteMany({
      where: { createdAt: { lt: oneEightyDaysAgo } },
    });
    logger.info(`[RetentionJob] Deleted ${auditCount} audit log entries older than 180 days`);
  } catch (err) {
    logger.error({ err }, '[RetentionJob] Failed to purge old audit logs');
  }

  // ─── 4. StatsSnapshots for users inactive for > 90 days ──────────────────
  // "Inactive" = no AuthSession created in the last 90 days.
  // We find those user IDs first, then delete their snapshot rows.
  // Snapshots are regenerated on the next stats request; no data is permanently lost.
  try {
    // Users who have at least one session in the last 90 days = active
    const activeSessions = await prisma.authSession.findMany({
      where: { createdAt: { gte: ninetyDaysAgo } },
      select: { userId: true },
      distinct: ['userId'],
    });
    const activeUserIds = activeSessions.map((s) => s.userId);

    const { count: snapCount } = await prisma.statsSnapshot.deleteMany({
      where: {
        userId: { notIn: activeUserIds.length > 0 ? activeUserIds : ['__none__'] },
        fetchedAt: { lt: ninetyDaysAgo },
      },
    });
    logger.info(`[RetentionJob] Deleted ${snapCount} stale stats snapshots for inactive users`);
  } catch (err) {
    logger.error({ err }, '[RetentionJob] Failed to purge stale stats snapshots');
  }

  // ─── 5. GDPR hard-delete: Users soft-deleted more than 30 days ago ────────
  // The User model has a `deletedAt` nullable field used for soft-deletion.
  // After 30 days we permanently erase the row; all child tables cascade via Prisma schema.
  try {
    const { count: userCount } = await prisma.user.deleteMany({
      where: {
        deletedAt: { not: null, lt: thirtyDaysAgo },
      },
    });
    logger.info(`[RetentionJob] Hard-deleted ${userCount} GDPR-erased users (soft-deleted > 30d)`);
  } catch (err) {
    logger.error({ err }, '[RetentionJob] Failed to hard-delete GDPR-erased users');
  }

  const elapsed = Date.now() - start;
  logger.info(`[RetentionJob] Completed in ${elapsed}ms`);
}
