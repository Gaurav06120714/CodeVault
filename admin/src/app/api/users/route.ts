import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const query = req.nextUrl.searchParams.get("query") ?? "";
  const skip = parseInt(req.nextUrl.searchParams.get("skip") ?? "0", 10) || 0;
  const take = 25;

  const where = query
    ? {
        OR: [
          { githubLogin: { contains: query, mode: "insensitive" as const } },
          { handle: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { displayName: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        githubLogin: true,
        handle: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        role: true,
        plan: true,
        createdAt: true,
        deletedAt: true,
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({ items, total, skip, take });
}
