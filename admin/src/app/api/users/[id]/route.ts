import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/users/[id] — full user detail
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      githubLogin: true,
      handle: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      role: true,
      plan: true,
      publicProfileEnabled: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
      connections: {
        select: {
          id: true,
          platform: true,
          username: true,
          syncEnabled: true,
          tokenStatus: true,
          solvedCount: true,
          lastSyncedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      },
      syncRuns: {
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          status: true,
          trigger: true,
          itemsFetched: true,
          itemsPushed: true,
          errorCode: true,
          startedAt: true,
          finishedAt: true,
          createdAt: true,
          connection: { select: { platform: true } },
        },
      },
      _count: {
        select: { problems: true, syncRuns: true, followers: true, following: true, notifications: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Problem counts per platform
  const problemsByPlatform = await prisma.problem.groupBy({
    by: ["platform"],
    where: { userId: id },
    _count: { id: true },
  });

  return NextResponse.json({ user, problemsByPlatform });
}

// PATCH /api/users/[id] — admin actions (role change, ban/unban)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const data: Record<string, unknown> = {};

  if (body.role === "admin" || body.role === "user") {
    data.role = body.role;
  }

  if (body.action === "ban") {
    data.deletedAt = new Date();
  } else if (body.action === "unban") {
    data.deletedAt = null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid action" }, { status: 400 });
  }

  const updated = await prisma.user.update({ where: { id }, data });

  // Audit
  prisma.auditLog
    .create({
      data: {
        userId: admin.userId,
        action: "admin",
        targetType: "user",
        targetId: id,
        metadata: { changes: JSON.parse(JSON.stringify(data)) },
      },
    })
    .catch(() => undefined);

  return NextResponse.json({ ok: true, role: updated.role, deletedAt: updated.deletedAt });
}
