# 16. Rate Limiting

## What it is
Cap how often a client can hit an endpoint — especially auth — to thwart brute-force,
credential-stuffing, enumeration, and abuse.

## Applied to CodeVault
- **web-backend auth endpoints** (`fc15df6`): Redis fixed-window limiter
  (`middlewares/rateLimit.middleware.ts`) wired to auth routes:
  - `POST /auth/email` (magic-link send) → **5 / 15 min per IP** (email abuse / enumeration)
  - `POST /auth/github` + `/auth/email/verify` → **20 / min per IP**
  - Returns `429` + `Retry-After`; **fails open** on Redis errors so it never locks out real users.
- **git-service** has its own limiter (`middlewares/rateLimit.middleware.ts`) on **`/api/ingest`**
  and **`/api/sync`** (per-user, keyed off the JWT).

## Implementation checklist
- [x] web-backend auth endpoints rate-limited (magic-link strictest)
- [x] git-service ingest + sync endpoints rate-limited (per-user)
- [x] `429` + `Retry-After`, fail-open on Redis hiccups
- [ ] Global per-IP limit at the edge (CDN/WAF) at deploy

**Status: ✅ Implemented on auth + ingest/sync; add edge limits at deploy.**
