import type { Request, Response, NextFunction } from 'express';
import { adminPrisma } from '../lib/prisma';
import logger from '../lib/logger';

// Owner allowlist (belt-and-suspenders alongside the DB role). Override via env.
// GitHub logins are case-insensitive — normalize to lower-case for comparison.
const ADMIN_LOGINS = (process.env.ADMIN_GITHUB_LOGINS || 'Gaurav06120714,aishwaryaV007')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// Owner-only admin guard (see /admin/plan.md §2). Runs AFTER requireAuth.
// Grants access ONLY when: DB role === 'admin' AND the GitHub login is in the allowlist.
// Uses adminPrisma (RLS-bypassing owner connection) to read the user + write the audit entry.
// Fails CLOSED with 404 (never reveal the route exists).
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  try {
    const u = await adminPrisma.user.findUnique({
      where: { id: userId },
      select: { role: true, githubLogin: true },
    });
    const ok =
      u?.role === 'admin' && !!u.githubLogin && ADMIN_LOGINS.includes(u.githubLogin.toLowerCase());
    if (!ok) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    // Audit every admin request (best-effort — never block on the log write).
    adminPrisma.auditLog
      .create({
        data: {
          userId,
          action: 'admin',
          targetType: 'admin_api',
          ip: req.ip ?? null,
          metadata: { method: req.method, path: req.originalUrl },
        },
      })
      .catch(() => undefined);
    next();
  } catch (err) {
    logger.warn({ err }, 'requireAdmin check failed');
    res.status(404).json({ error: 'Not found' });
  }
}
