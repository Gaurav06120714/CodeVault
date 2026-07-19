import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  prisma.auditLog
    .create({
      data: { userId: admin.userId, action: "admin", targetType: "admin_api", metadata: { path: "/api/overview" } },
    })
    .catch(() => undefined);

  const [users, admins, activeSubscriptions, payments, problemsSynced, syncRuns, failedSyncs] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.subscription.count({ where: { status: "active" } }),
    prisma.payment.count(),
    prisma.problem.count(),
    prisma.syncRun.count(),
    prisma.syncRun.count({ where: { status: "failed" } }),
  ]);

  const agg = await prisma.payment.aggregate({
    _sum: { amount: true, refundedAmt: true },
    where: { status: { in: ["succeeded", "partially_refunded"] } },
  });
  const revenueMinor = (agg._sum.amount ?? 0) - (agg._sum.refundedAmt ?? 0);

  // Recent signups (last 5)
  const recentSignups = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: { id: true, displayName: true, githubLogin: true, handle: true, avatarUrl: true, createdAt: true },
  });

  // Recent syncs (last 5)
  const recentSyncs = await prisma.syncRun.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      status: true,
      trigger: true,
      itemsFetched: true,
      itemsPushed: true,
      errorCode: true,
      createdAt: true,
      user: { select: { displayName: true, githubLogin: true, handle: true } },
      connection: { select: { platform: true } },
    },
  });

  return NextResponse.json({
    users, admins, activeSubscriptions, payments, problemsSynced, syncRuns, failedSyncs, revenueMinor,
    recentSignups, recentSyncs,
  });
}
