// Same-origin proxy for the admin console: /admin/* → ADMIN_URL/admin/*.
// The admin app runs with basePath "/admin", so its pages, API routes and assets
// all live under /admin — forwarding them here keeps everything on the frontend's
// origin, so the HttpOnly cv_access cookie is sent to the admin service.
import { NextRequest } from "next/server";
import { proxyTo } from "@/utils/proxy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The admin service URL is public and fixed (not a secret), so we default to it
// when ADMIN_URL isn't set — the /admin proxy then works without extra env config.
const ADMIN_URL = process.env.ADMIN_URL || "https://codevault-admin-ig6c.onrender.com";

async function handler(
  req: NextRequest,
  ctx: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await ctx.params;
  const sub = path && path.length ? `admin/${path.join("/")}` : "admin";
  return proxyTo(req, ADMIN_URL, sub);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
export const HEAD = handler;
