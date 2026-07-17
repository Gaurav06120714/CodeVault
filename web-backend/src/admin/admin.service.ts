import { adminPrisma } from '../lib/prisma';

// Admin data access — uses adminPrisma (RLS-bypassing owner connection) so it can see ALL rows.
// See /admin/plan.md §3. This is the one place RLS is intentionally bypassed — only ever reached
// behind requireAuth + requireAdmin, and every request is audited.

export const AdminService = {
  // Overview KPIs. Counts come from the shared DB (users/subs/payments live in web-backend;
  // problems/sync_runs are the git-service tables in the SAME Postgres — so one indexed set of
  // counts covers the whole system without extra cross-service calls).
  async overview() {
    const [users, admins, activeSubscriptions, payments, problemsSynced, syncRuns] =
      await Promise.all([
        adminPrisma.user.count(),
        adminPrisma.user.count({ where: { role: 'admin' } }),
        adminPrisma.subscription.count({ where: { status: 'active' } }),
        adminPrisma.payment.count(),
        adminPrisma.problem.count(),
        adminPrisma.syncRun.count(),
      ]);
    const agg = await adminPrisma.payment.aggregate({
      _sum: { amount: true, refundedAmt: true },
      where: { status: { in: ['succeeded', 'partially_refunded'] } },
    });
    const revenueMinor = (agg._sum.amount ?? 0) - (agg._sum.refundedAmt ?? 0);
    return {
      users,
      admins,
      activeSubscriptions,
      payments,
      problemsSynced,
      syncRuns,
      revenueMinor, // minor units (paise/cents)
    };
  },

  // Paginated user list with search across login/handle/email/name.
  async listUsers(query: string, take = 25) {
    const where = query
      ? {
          OR: [
            { githubLogin: { contains: query, mode: 'insensitive' as const } },
            { handle: { contains: query, mode: 'insensitive' as const } },
            { email: { contains: query, mode: 'insensitive' as const } },
            { displayName: { contains: query, mode: 'insensitive' as const } },
          ],
        }
      : {};
    return adminPrisma.user.findMany({
      where,
      take,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        githubLogin: true,
        handle: true,
        displayName: true,
        email: true,
        role: true,
        plan: true,
        createdAt: true,
      },
    });
  },
};
