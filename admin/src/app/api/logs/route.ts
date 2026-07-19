import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const type = req.nextUrl.searchParams.get("type") ?? "errors";
  const skip = parseInt(req.nextUrl.searchParams.get("skip") ?? "0", 10) || 0;
  const take = 25;

  if (type === "audit") {
    const [items, total] = await Promise.all([
      prisma.auditLog.findMany({
        take,
        skip,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          action: true,
          targetType: true,
          targetId: true,
          ip: true,
          metadata: true,
          createdAt: true,
          user: { select: { displayName: true, githubLogin: true, handle: true } },
        },
      }),
      prisma.auditLog.count(),
    ]);
    return NextResponse.json({ items, total, skip, take, type });
  }

  // Default: sync errors
  const where = { status: "failed" as const };
  const [items, total] = await Promise.all([
    prisma.syncRun.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        trigger: true,
        errorCode: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        user: { select: { id: true, displayName: true, githubLogin: true, handle: true } },
        connection: { select: { platform: true, username: true } },
      },
    }),
    prisma.syncRun.count({ where }),
  ]);

  return NextResponse.json({ items, total, skip, take, type });
}
