# 08. API Endpoint Protection

## What it is
Backend routes must only be callable by authorized clients — via auth layers and a locked-down
CORS policy — so the API isn't an open door.

## Applied to CodeVault
- **JWT auth** on protected endpoints (`requireAuth`) across both services; the **git-service is
  NOT reachable with a static browser key** — it requires the user's JWT.
- **CORS** configured on both services (`cors({ origin: env.CORS_ORIGIN, credentials: true })`),
  restricted to the app origin (`http://localhost:3000` in dev).
- **Rate limiting** on sensitive endpoints — see [16-rate-limiting.md](16-rate-limiting.md).
- **SSRF egress allowlist** on git-service outbound calls (only platform + GitHub hosts) —
  `git-service/src/lib/egress.ts`.

## Implementation checklist
- [x] JWT-gated protected routes on both services
- [x] CORS restricted to the app origin
- [x] SSRF egress allowlist on outbound requests (git-service)
- [x] Rate limiting on auth + ingest/sync endpoints
- [ ] Tighten CORS origins per environment (prod domains) at deploy

**Status: ✅ Implemented.**
