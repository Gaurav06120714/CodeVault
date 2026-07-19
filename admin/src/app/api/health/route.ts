import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";

type PlatformResult = {
  name: string;
  status: "up" | "down";
  responseMs: number;
  endpoint: string;
};

async function pingPlatform(name: string, url: string, init?: RequestInit): Promise<PlatformResult> {
  const start = Date.now();
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(8000),
    });
    const ms = Date.now() - start;
    return { name, status: res.ok || res.status < 500 ? "up" : "down", responseMs: ms, endpoint: url };
  } catch {
    return { name, status: "down", responseMs: Date.now() - start, endpoint: url };
  }
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const results = await Promise.all([
    pingPlatform("LeetCode", "https://leetcode.com/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "{ __typename }" }),
    }),
    pingPlatform("Codeforces", "https://codeforces.com/api/user.info?handles=tourist"),
    pingPlatform("CodeChef", "https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all"),
    pingPlatform("HackerRank", "https://www.hackerrank.com/rest/contests/master/tracks"),
  ]);

  return NextResponse.json({ results, checkedAt: new Date().toISOString() });
}
