import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const status = req.nextUrl.searchParams.get("status") ?? "";
  const skip = parseInt(req.nextUrl.searchParams.get("skip") ?? "0", 10) || 0;
  const take = 25;

  const where = status ? { status: status as "queued" | "running" | "success" | "partial" | "failed" | "expired" } : {};

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
        itemsFetched: true,
        itemsPushed: true,
        errorCode: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
        user: { select: { id: true, displayName: true, githubLogin: true, handle: true, avatarUrl: true } },
        connection: { select: { platform: true, username: true } },
      },
    }),
    prisma.syncRun.count({ where }),
  ]);

  return NextResponse.json({ items, total, skip, take });
}
