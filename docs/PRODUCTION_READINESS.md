# 🚀 CodeVault — Production Readiness Guide

> How CodeVault is currently deployed, what has to change before it is truly
> production-grade, and two concrete paths to get there. Companion to
> [DEPLOYMENT.md](DEPLOYMENT.md) and the repo's `docker-compose.prod.yml`.

---

## 1. Current deployment (as-is)

| Layer | What it is today | Where |
|-------|------------------|-------|
| Cloud | **Render** (runs on AWS, Oregon / US-West) | Render account |
| Frontend | `codevault-ig6c` — Next.js 16, Docker web service | Render |
| Backend | `codevault-backend-ig6c` — Express 5, Docker | Render |
| Git-service | `codevault-git-ig6c` — Express 5 + BullMQ, Docker | Render |
| Database | **Render Managed PostgreSQL 18** (`codevault-db-ig6c`) | Render |
| Redis | ⚠️ Points at `vyroportify-redis` (a *different* project's Redis) | Render |
| Source of truth | GitHub `Gaurav06120714/CodeVault`, branch `main` | GitHub |
| Deploy trigger | **Auto-deploy on push to `main`** | Render ← GitHub |

**Pipeline:** `git push → GitHub → Render builds the Dockerfiles → runs the services`.

**Verdict:** the *architecture* is production-capable, but the current **free tier + shared
Redis + no backups** make it a demo, not production.

---

## 2. Blockers — must fix before "production"

| # | Issue | Risk | Fix |
|---|-------|------|-----|
| 1 | **Free tier** on all services | Cold starts; 750 hr/mo cap; **free Postgres expires after 90 days = data loss** | Move to a paid plan or a VPS (§4) |
| 2 | **Redis borrowed** from another project (`vyroportify-redis`) | Shared keyspace; deleting that project breaks CodeVault | Provision a **dedicated** Redis |
| 3 | **Duplicate frontend** (`codevault` + `codevault-ig6c`) | Wasted resources, confusion | Delete the duplicate, keep one |
| 4 | **No database backups** | One bad migration/expiry = everything gone | Automated backups (paid) or `pg_dump` cron |
| 5 | **ENCRYPTION_KEY safety** | Encrypts users' platform session tokens; losing/rotating it makes them undecryptable | Back it up securely; never regenerate |
| 6 | **No health checks / alerting** | Outages go unnoticed | `healthCheckPath` + uptime monitor (§5) |

---

## 3. Recent fixes already applied

- ✅ **Frontend build failure** — `next.config.ts` had `output: "standalone"` commented out while
  the Dockerfile copies `.next/standalone`; re-enabled so Docker builds succeed. (commit `a2e868b`)
- ✅ **Scraper timeouts** — added an 8 s timeout to the LeetCode and Codeforces stats fetches so a
  slow platform can't hang the whole dashboard. (commit `a0bfc2e`)

### Phase 1–6 hardening (delivered)

| Phase | Delivered in code / CI / config |
|-------|---------------------------------|
| **1 CI** | Frontend CI job; coverage (v8) + artifacts; SCA/secret-scan/SAST green |
| **2 Tests** | Scraper + stats unit tests; auth/**BOLA** gate; CSRF + contract HTTP tests (web-backend 12→52, git-service 90→93) |
| **3 Security** | **Log redaction** (both services); Helmet/CSRF/cookie verification; **OWASP ZAP DAST** workflow (`security-dast.yml`) |
| **4 Frontend a11y** | Accessible `ConfirmDialog` + `Toast` (removed native `alert`/`confirm`); global reduced-motion; OpenGraph; **axe + Lighthouse** CI (`a11y-perf.yml`) |
| **5 Observability** | Prometheus `/metrics` (both services); `X-Request-Id` correlation; env-gated **Sentry** (BE); `observability/` (scrape config, alert rules, Grafana RED dashboard) |
| **6 Scalability** | **Snapshot fallback** for stats on upstream failure; sync concurrency + cooldown + kill-switch (existing); **k6** load test with SLO thresholds (`load-tests/`) |

### Still requires accounts / infra (cannot be completed in code)

- **KMS envelope encryption + `key_version`** — changing the on-disk crypto format risks making
  every stored token undecryptable; needs a planned, backward-compatible migration + a KMS.
- **Per-repo GitHub scope** — currently uses the `repo` scope; true per-repo access means migrating
  to a **GitHub App** (fine-grained), a product decision (would affect private-repo sync).
- **Pentest sign-off**, **Sentry DSN**, **Grafana/Prometheus hosting**, **Alertmanager → PagerDuty**,
  **status page**, **synthetic uptime checks**, **Lighthouse/axe budgets passing**, **load-test execution
  on a non-sleeping tier** — all need external services or a running environment.

---

## 4. Two production paths

### Path A — Render, paid (easiest, managed)
- Upgrade **backend** + **git-service** to **Starter ($7/service)** → no sleep, no cold starts.
- Put **Postgres** on a paid plan → automated backups, no 90-day expiry.
- Add a **dedicated Redis** instance for CodeVault.
- **Pros:** push-to-deploy, managed DB, zero server admin. **Cons:** ~$25–35/mo total.

### Path B — Single VPS (cheapest, full control)
- Use the repo's existing **`docker-compose.prod.yml` + `Caddyfile`** on one Linux VPS
  (MilesWeb 8 GB / Hetzner / Oracle Always Free). Everything runs on one internal Docker
  network; Caddy handles automatic HTTPS.
- **Pros:** ~$7–9/mo total, no cold starts, fixes the proxy-chain and build-OOM issues at once.
- **Cons:** you manage OS updates, backups, and uptime.

**Steps (Path B):**
```bash
# 1. On a fresh Ubuntu VPS, install Docker + compose plugin
curl -fsSL https://get.docker.com | sh

# 2. Clone and configure
git clone https://github.com/Gaurav06120714/CodeVault.git && cd CodeVault
cp .env.production.example .env      # then fill in real secrets (see the file's comments)

# 3. Point your domain's A record at the VPS IP, then bring it up
docker compose -f docker-compose.prod.yml up -d --build

# 4. Verify — Caddy auto-issues HTTPS for $DOMAIN
docker compose -f docker-compose.prod.yml ps
```

> **Recommendation:** cost-sensitive / solo → **Path B (VPS)**. Want zero server maintenance →
> **Path A (Render paid)**.

---

## 5. Hardening checklist (do before real users)

**Infrastructure**
- [ ] Move off free tier (Path A or B)
- [ ] Dedicated Redis for CodeVault
- [ ] Delete duplicate `codevault` frontend service
- [ ] Automated Postgres backups + a tested restore
- [ ] Back up `ENCRYPTION_KEY` and `JWT_SECRET` outside the host
- [x] `healthCheckPath` set (`/api/health` backend, `/health` git-service)
- [ ] Uptime monitor + alerts (e.g. UptimeRobot / BetterStack)

**Application**
- [ ] `prisma migrate deploy` (NOT `migrate dev`) in production
- [ ] Rate-limit outbound platform scraping (avoid IP bans, respect ToS)
- [ ] Confirm the 20-min stats cache is active (already implemented)
- [ ] Add monitoring around the **CodeChef HTML scraper** — most fragile integration
- [ ] Correct OAuth callback/redirect URLs for the production domain

**Repo hygiene**
- [x] Remove empty stubs: `web-backend/src/services/platforms/{leetcode,codeforces,index}.service.ts`
- [x] Remove scratch files: `web-backend/debug_codechef.js`, `web-backend/test_codechef.js`
- [ ] Keep secrets out of git (gitleaks already runs in CI ✅)

**Security (already scaffolded in `security/`)**
- [ ] Helmet + CORS locked to the production origin
- [ ] Secure, HttpOnly, SameSite cookies over HTTPS only
- [x] Run the CI SAST (CodeQL) + `npm audit` gates on every deploy

---

## 6. Required environment variables

See **`.env.production.example`** in the repo root for the full annotated template. Summary:

| Variable | Purpose | Notes |
|----------|---------|-------|
| `DOMAIN` | Public hostname for Caddy HTTPS | A record → server IP |
| `DB_PASSWORD` | Postgres password | Long & random |
| `JWT_SECRET` | Signs auth tokens | `openssl rand -base64 48`; same on both backends |
| `ENCRYPTION_KEY` | Encrypts platform session tokens | `openssl rand -hex 32` (64 hex); **back up** |
| `GITHUB_CLIENT_ID` / `_SECRET` | GitHub OAuth + repo publishing | Callback → `https://<DOMAIN>/login/callback` |
| `GOOGLE_CLIENT_ID` / `_SECRET` | Google OAuth | Redirect → `https://<DOMAIN>/login/callback/google` |

`DATABASE_URL` and `REDIS_URL` are derived from internal service names by
`docker-compose.prod.yml` — do not set them by hand in Path B.

---

*Last updated: 2026-07-21.*
