// Runtime same-origin proxy: /api/* → BACKEND_URL/api/*. See src/utils/proxy.ts.
import { NextRequest } from "next/server";
import { proxy } from "@/utils/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  return proxy(req, process.env.BACKEND_URL, path);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
