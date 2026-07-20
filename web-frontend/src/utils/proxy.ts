/**
 * Runtime same-origin proxy for deployment (Render, etc).
 *
 * Next.js `rewrites()` are resolved at BUILD time and baked into the routes
 * manifest — but BACKEND_URL / GIT_URL come from `fromService.hostport`, which
 * only exist at RUNTIME. So the old next.config rewrite never fired in prod and
 * every /api/* request 404'd. These route handlers forward per-request instead,
 * reading the target from env at request time.
 *
 * The browser only ever talks to this frontend's origin, so the HttpOnly session
 * cookies (path=/api, SameSite=strict, Secure) and CSRF header work with no
 * cross-domain issues. Set-Cookie from the upstream is forwarded verbatim.
 */
import { NextRequest } from "next/server";

// Render passes "host:port" (no scheme) via fromService.hostport — add http://
// for internal traffic. A full URL (Oracle/other) is used as-is.
const withScheme = (u?: string) =>
  u && !/^https?:\/\//.test(u) ? `http://${u}` : u;

export async function proxy(
  req: NextRequest,
  targetBase: string | undefined,
  path: string[]
): Promise<Response> {
  const base = withScheme(targetBase);
  if (!base) {
    return new Response(
      JSON.stringify({ message: "Upstream proxy target not configured" }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  const url = `${base}/api/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("content-length");

  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const body = hasBody ? await req.arrayBuffer() : undefined;

  // Free-tier services sleep after ~15 min; the first request while the upstream cold-boots can
  // get a 502/503/504 from Render's gateway (or a connection error). Retry a few times with backoff
  // so login/API calls ride out the wake-up instead of failing. Safe here: a gateway error means the
  // upstream app never processed the request, so there's nothing to double-submit.
  const GATEWAY_ERRORS = new Set([502, 503, 504]);
  let upstream: Response | undefined;
  let lastErr: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 2000)); // 0, 2s, 4s, 6s
    try {
      upstream = await fetch(url, { method: req.method, headers, body, redirect: "manual" });
      if (!GATEWAY_ERRORS.has(upstream.status)) break; // got a real response
    } catch (err) {
      lastErr = err; // connection refused / reset while the upstream is booting — retry
    }
  }
  if (!upstream) {
    return new Response(
      JSON.stringify({ message: "Upstream unavailable (service may be waking up — try again)" }),
      { status: 503, headers: { "content-type": "application/json" } }
    );
  }
  void lastErr;

  const resHeaders = new Headers();
  upstream.headers.forEach((value, key) => {
    const k = key.toLowerCase();
    // set-cookie handled separately. Drop content-encoding/content-length/transfer-encoding:
    // fetch() already decoded the (gzip) body, so the upstream length no longer matches — keeping
    // it truncates the body and yields "Unterminated string in JSON". Let the runtime recompute.
    if (
      k === "set-cookie" ||
      k === "content-encoding" ||
      k === "content-length" ||
      k === "transfer-encoding"
    )
      return;
    resHeaders.set(key, value);
  });
  for (const cookie of upstream.headers.getSetCookie?.() ?? []) {
    resHeaders.append("set-cookie", cookie);
  }

  return new Response(await upstream.arrayBuffer(), {
    status: upstream.status,
    headers: resHeaders,
  });
}
