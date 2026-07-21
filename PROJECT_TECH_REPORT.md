# CodeVault — Project & Tech Stack Report

> Aggregates your competitive-programming activity (LeetCode, Codeforces, CodeChef, HackerRank)
> into one dashboard and auto-publishes accepted solutions to a clean GitHub repo.
> **Live demo:** https://codevault-ig6c.onrender.com

---

## 1. Overview

CodeVault is a TypeScript monorepo (~14k lines of app code, ~8k lines of design docs) built as a
set of microservices. It fetches public coding stats by username (**Path A**) and syncs actual
submitted source code via an authorized session or browser extension (**Path B**), publishing each
solution to GitHub as a folder-per-problem.

| Component | Stack | Role |
|-----------|-------|------|
| **web-backend** | Express 5, Prisma, Redis, Zod, JWT | Main API — auth, users, stats scraping, social features |
| **git-service** | Express 5, Prisma, BullMQ | Isolated service that pushes solutions to GitHub + generates READMEs |
| **web-frontend** | Next.js 16, React 19, Tailwind 4, React Query | Dashboard, profiles, settings, messaging; same-origin proxy |
| **admin** | Next.js 16, React 19, Prisma | Separate admin panel |
| **mobile** | Expo 54 / React Native 0.81 | Mobile app (tabs, chat, problem views) |
| **browser-extension** | Vite 5 + CRXJS (MV3) | Client-side code capture (preferred Path B) |
| **frontendHtml** | Static HTML | Landing/static pages |
| **database** | PostgreSQL 16 (raw SQL + Prisma) | schema, RLS, partitioning, triggers, roles |

---

## 2. Complete Tech Stack

### Languages & Core
- **TypeScript** everywhere (strict), **Node.js 20 LTS** runtime
- **Prisma ORM 5** against **PostgreSQL 16**
- **Redis 7** (via `ioredis`) — caching, tag cache, and queue backend

### Backends (2 services, near-identical stack)

| Concern | web-backend | git-service |
|---------|-------------|-------------|
| Framework | Express 5 | Express 5 |
| Validation | Zod | Zod |
| Auth | jsonwebtoken (JWT), cookie-parser | shared JWT (`JWT_SECRET`) |
| Security | Helmet, CORS | Helmet, CORS |
| HTTP client | axios | axios |
| Logging | pino + pino-http | pino + pino-http |
| Scheduling | node-cron 4 | node-cron 3 |
| Queue | — | BullMQ 5 (background GitHub-push jobs) |
| Mail | nodemailer | — |
| Tests | Vitest | Vitest |

### Frontends
- **Web** (`web-frontend`): Next.js 16 (App Router, `output: standalone`), React 19, Tailwind CSS 4,
  TanStack React Query 5, lucide-react, clsx/tailwind-merge. Acts as a **same-origin proxy**
  (`/api` → backend, `/gitapi` → git-service).
- **Admin** (`admin`): separate Next.js 16 / React 19 app with its own Prisma client + JWT.
- **Static** (`frontendHtml`): plain HTML pages.

### Mobile
- Expo 54 + React Native 0.81 + expo-router 6, React 19
- expo-secure-store (token storage), react-native-reanimated 4, react-native-svg, React Query, axios

### Browser Extension
- Vite 5 + `@crxjs/vite-plugin` (Manifest V3), webextension-polyfill, Vitest
- The "Path B v2" preferred code-sync source (captures accepted code in the user's own browser)

### Auth Providers
- **GitHub OAuth** (also the publish target), **Google OAuth**, plus email/password (nodemailer verification)

---

## 3. Deployment

Two supported targets.

### Target 1 — Render (the live demo) — `render.yaml` Blueprint
- Provisions Postgres + Redis + **3 Docker web services** (frontend, backend, git-service)
- All on **free tier**; only the frontend is public and proxies to the two backends over
  **public HTTPS** (free tier has no private networking)
- Secrets (`ENCRYPTION_KEY`, OAuth secrets) set as `sync: false`; `JWT_SECRET` auto-generated & shared

### Target 2 — Single VM (Oracle Cloud Always Free) — `docker-compose.prod.yml`
- Full stack on one internal Docker network: `postgres:16-alpine`, `redis:7-alpine`, 3 app containers
- **Caddy 2** is the only exposed service (80/443) → auto **Let's Encrypt** TLS → reverse-proxies the frontend
- `docker-compose.override.yml` provides hot-reload dev mode (nodemon)

### Containerization
- **Multi-stage Dockerfiles**: backend compiles TS → runs `dist` on a **non-root** slim Alpine image
  (openssl added for Prisma's engine); frontend uses Next.js `standalone` output.

### CI/CD & Security tooling — `.github/workflows/ci.yml`
- Runs on push/PR to `main`, **matrix** over both backends
- Pipeline: `npm ci` → **prisma generate** → **tsc --noEmit** (typecheck) → lint → test → **`npm audit`** (SCA)
- **Gitleaks** (CLI, pinned v8.18.4) — full-history secret scanning
- **CodeQL** — SAST for JavaScript/TypeScript
- Repo also ships `.gitleaks.toml` and a large `security/` hardening doc set

---

## 4. Platform Scrapers (deep dive)

Two independent scraping subsystems, split by "failure domain."

### Path A — Public stats (`web-backend/src/services/platforms/`)
Fetch by **username only, no auth**. Powers the dashboard.

> Note: `leetcode.service.ts`, `codeforces.service.ts`, and `index.ts` are **empty 0-byte stubs**;
> the real code lives in `leetcode.ts` / `codeforces.ts`, while CodeChef/HackerRank use `.service.ts`.
> This naming inconsistency looks like an abandoned refactor and is worth cleaning up.

| Platform | Method | Robustness |
|----------|--------|-----------|
| **LeetCode** (`leetcode.ts`) | Internal GraphQL — one query pulls stats, languages, topics, heatmap, recent | 🟢 Cleanest; schema-dependent but structured |
| **Codeforces** (`codeforces.ts`) | Official public REST (`user.status`, `user.rating`) | 🟢 Most reliable; dedupes via `Set`, caches tags in Redis 7d |
| **CodeChef** (`codechef.service.ts`) | HTML **regex scraping** + recent-submissions endpoint | 🔴 Most fragile; 8+ regexes and `dd/mm/yy` date parsing break on any reskin |
| **HackerRank** (`hackerrank.service.ts`) | Undocumented REST (`/rest/hackers/.../badges`) | 🟡 Counts badges' solved rather than ELO — a thoughtful choice |

**Good patterns:** every scraper returns `null` on failure (graceful degradation), normalizes to a
shared shape (`total/topics/heatmap/recent`), and shares a Redis tag-cache convention
(`tag_cache:<platform>:<id>`, 7-day TTL).

**Weaknesses:** heavy `any` typing; N+1 tag fan-out via `Promise.all` with no concurrency cap;
CodeChef HTML/date parsing is the single most likely thing to silently break.

### Path B — Code sync (`git-service/src/services/submissions/`)
Fetches **actual source code** with an authorized session token, then publishes to GitHub.
Better engineered: typed `SubmissionAdapter` interface, dedicated `ExpiredSessionError` /
`UpstreamError`, maps 401/403 → "reconnect required." The docs mark **Path B v2 (browser extension)**
as preferred — code is captured client-side, so no server-stored session token to replay.

---

## 5. Documentation Set (`docs/`, 37 files, ~8,000 lines)

A plan-first project — arguably more spec than code. Grouped by role:

- **Architecture & specs:** `DATABASE_PLAN` (700), `BACKEND_PLAN` (676), `FRONTEND_PLAN` (613),
  `API_CONTRACT` (479), `PLATFORM_INTEGRATION` (410), `PLATFORM_STATS_EXTRACTION` (333),
  `ARCHITECTURE` (245), `TECH_STACK` (215)
- **Ops / DevOps:** `DEPLOYMENT` (488), `DEVOPS_PLAN`, `OBSERVABILITY_PLAN` (305), `MONITORING`,
  `SCALABILITY`, `DISASTER_RECOVERY`, `DEPLOY`, `HOW_TO_RUN`
- **Product / planning:** `ROADMAP` (306), `FEATURES` (284), `plan`, `business_model`, `TEAM_PLAN`,
  `PROGRESS`, `FUTURE_IMPLEMENTATION_TASKS`, plus feature sub-plans (`PLAN_MESSAGING`,
  `PLAN_FOLLOW_SYSTEM`, `PLAN_PORTFOLIO`, `EXTENSION_PLAN`, `MOBILE_APP`)
- **Governance / misc:** `COMPLIANCE`, `TESTING_PLAN`, `DBMS_CONCEPTS`, `FAQ`, `context`, `PROJECT_ANALYSIS`

**Observations**
1. **Aspirational vs shipped gap** — `PLATFORM_INTEGRATION.md` openly warns the shipped code may not
   fully match; it points to `FEATURES.md` as the source of truth. Good self-awareness.
2. **Strong cross-linking** — docs reference each other and link to exact source files.
3. **ToS honesty** — each platform's scraping is rated by ToS risk (e.g. LeetCode "🟠 Medium").
4. **Redundancy** — `DEPLOY`/`DEPLOYMENT`, `plan`/`implementation_plan`, and several `*_PLAN` files
   overlap; the set could be consolidated ~30%.
5. Reads like a **portfolio/learning project** presented with production-grade rigor.

---

## 6. Recommendations

1. **Remove the empty `.service.ts` stubs** and standardize Path A file naming.
2. **Harden CodeChef parsing** — it is the most brittle integration (HTML regex + date parsing).
3. **Cap tag-enrichment concurrency** in the Path A scrapers to avoid upstream throttling.
4. **Consolidate overlapping docs** (~30% reduction) and delete scratch files
   (`debug_codechef.js`, `test_codechef.js`) from the backend root.
5. **Tighten `any` typing** in the platform services.

---

*Generated as a project analysis report.*
