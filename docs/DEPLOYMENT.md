# CodeVault — Deployment Guide

> Complete guide to deploying the CodeVault microservice architecture to production using Render, Neon, and Upstash.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Platforms Used](#platforms-used)
- [Pre-Deployment Setup](#pre-deployment-setup)
- [Service Deployments](#service-deployments)
  - [1. Database (PostgreSQL)](#1-database-postgresql)
  - [2. Cache (Redis)](#2-cache-redis)
  - [3. Web Backend](#3-web-backend)
  - [4. Git Service](#4-git-service)
  - [5. Web Frontend](#5-web-frontend)
  - [6. Admin Panel](#6-admin-panel)
- [Environment Variables Reference](#environment-variables-reference)
- [GitHub OAuth Setup](#github-oauth-setup)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Bugs Fixed During Deployment](#bugs-fixed-during-deployment)
- [Known Limitations (Free Tier)](#known-limitations-free-tier)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

CodeVault is split into **four services**, each deployed independently:

```
┌─────────────────────────────────────────────────────────────────┐
│                        INTERNET                                 │
│                                                                 │
│   ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│   │  Frontend    │───▶│  Backend     │───▶│  Git Service  │     │
│   │  (Next.js)   │    │  (Express)   │    │  (Express)    │     │
│   │  Port: 3000  │    │  Port: 4000  │    │  Port: 5050   │     │
│   └──────────────┘    └──────┬───────┘    └──────┬────────┘     │
│                              │                    │              │
│                     ┌────────┴────────────────────┘              │
│                     │                                            │
│              ┌──────┴──────┐    ┌──────────────┐                │
│              │  PostgreSQL │    │    Redis     │                 │
│              │  (Neon)     │    │  (Upstash)   │                 │
│              └─────────────┘    └──────────────┘                │
│                                                                 │
│   ┌──────────────┐                                              │
│   │  Admin Panel │ (Optional, owner-only dashboard)             │
│   │  (Next.js)   │                                              │
│   └──────────────┘                                              │
└─────────────────────────────────────────────────────────────────┘
```

### How the services communicate

| From | To | Purpose |
|------|----|---------|
| Frontend | Backend (`/api/*`) | Auth, user data, platform connections |
| Frontend | Git Service (`/api/*`) | Sync status, manual triggers |
| Backend | PostgreSQL | Read/write user data, submissions, settings |
| Backend | Redis | Rate limiting, caching, session management |
| Git Service | PostgreSQL | Read/write sync runs, problems |
| Git Service | Redis | Job queues (BullMQ), distributed locks |
| Admin | PostgreSQL | Read-only admin dashboard queries |

---

## Platforms Used

| Platform | Purpose | Free Tier |
|----------|---------|-----------|
| **[Render](https://render.com)** | Hosts all 4 services as Web Services | ✅ Free (750 hours/month) |
| **[Neon](https://neon.tech)** | Serverless PostgreSQL database | ✅ Free (0.5 GB storage) |
| **[Upstash](https://upstash.com)** | Serverless Redis (TLS-secured) | ✅ Free (10K commands/day) |
| **[GitHub](https://github.com)** | Source code hosting + OAuth login | ✅ Free |

### Why not use Render's built-in database?

Render's free PostgreSQL database has a **90-day expiry** — it gets deleted automatically after 90 days. Neon's free tier has no such limit, making it a more reliable choice for long-term projects.

---

## Pre-Deployment Setup

### 1. Create a Neon Database

1. Go to [neon.tech](https://neon.tech) and sign up.
2. Create a new project (e.g., `CodeVault`).
3. Copy the **connection string** — it looks like:
   ```
   postgresql://username:password@ep-xxx.us-east-2.aws.neon.tech/codevault?sslmode=require
   ```
4. Save this as your `DATABASE_URL`.

### 2. Create an Upstash Redis

1. Go to [upstash.com](https://upstash.com) and sign up.
2. Create a new Redis database (e.g., `CodeVault-Cache`).
3. Copy the **Redis URL** — it looks like:
   ```
   rediss://default:TOKEN@your-endpoint.upstash.io:6379
   ```

> ⚠️ **Critical:** The URL **must** start with `rediss://` (double `s`). Upstash requires TLS. Using `redis://` (single `s`) causes silent connection hangs that make login take 10+ minutes.

4. Save this as your `REDIS_URL`.

### 3. Create a GitHub OAuth App

1. Go to GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App.
2. Fill in:
   - **Application name:** `CodeVault`
   - **Homepage URL:** `https://your-frontend.onrender.com`
   - **Authorization callback URL:** `https://your-frontend.onrender.com/login/callback`
3. Click **Register application**.
4. Copy the **Client ID** and generate a **Client Secret**.

---

## Service Deployments

All services are deployed from the same GitHub repository. On Render, each service is configured with a **Root Directory** to point at the correct subfolder.

### 1. Database (PostgreSQL)

No deployment needed — Neon hosts this externally. The `DATABASE_URL` is passed to each service via environment variables.

**Important:** The backend's build command includes `npx prisma db push` which automatically creates all necessary tables in the Neon database on first deploy.

---

### 2. Cache (Redis)

No deployment needed — Upstash hosts this externally. The `REDIS_URL` is passed to each service via environment variables.

---

### 3. Web Backend

The core API that handles authentication, user data, and platform connections.

| Setting | Value |
|---------|-------|
| **Runtime** | Docker |
| **Source** | `https://github.com/YOUR_USER/CodeVault` |
| **Branch** | `main` |
| **Dockerfile Path** | `./web-backend/Dockerfile` |
| **Docker Build Context** | `./web-backend` |

**If using Node.js runtime instead of Docker:**

| Setting | Value |
|---------|-------|
| **Runtime** | Node |
| **Root Directory** | `web-backend` |
| **Build Command** | `npm install && npx prisma generate && npx prisma db push && npm run build` |
| **Start Command** | `npm start` |

**Environment Variables:**

| Key | Value | Required |
|-----|-------|----------|
| `DATABASE_URL` | Neon connection string | ✅ |
| `REDIS_URL` | Upstash Redis URL (`rediss://...`) | ✅ |
| `GITHUB_CLIENT_ID` | From GitHub OAuth App | ✅ |
| `GITHUB_CLIENT_SECRET` | From GitHub OAuth App | ✅ |
| `JWT_SECRET` | Secure string (min 32 chars, must match git-service) | ✅ |
| `ENCRYPTION_KEY` | 64-char hex string (must match git-service) | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `CORS_ORIGIN` | `https://your-frontend.onrender.com` | ✅ |
| `CROSS_SITE_COOKIES` | `true` | ✅ |
| `GOOGLE_CLIENT_ID` | From Google OAuth (optional) | ❌ |
| `GOOGLE_CLIENT_SECRET` | From Google OAuth (optional) | ❌ |

> ⚠️ **`CORS_ORIGIN`** must exactly match the deployed frontend URL. Without it, the backend defaults to `https://codevault.io` in production mode, blocking all API requests from the real frontend.

> ⚠️ **`CROSS_SITE_COOKIES`** must be `true` because the frontend and backend run on different Render subdomains. Without this, login cookies get blocked by the browser (SameSite policy) and users appear to never be logged in.

---

### 4. Git Service

The background microservice that syncs solved problems to users' GitHub repositories.

| Setting | Value |
|---------|-------|
| **Runtime** | Docker |
| **Dockerfile Path** | `./git-service/Dockerfile` |
| **Docker Build Context** | `./git-service` |

**If using Node.js runtime:**

| Setting | Value |
|---------|-------|
| **Root Directory** | `git-service` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |

**Environment Variables:**

| Key | Value | Required |
|-----|-------|----------|
| `DATABASE_URL` | Same Neon URL as backend | ✅ |
| `REDIS_URL` | Same Upstash URL as backend | ✅ |
| `JWT_SECRET` | **Must exactly match backend** | ✅ |
| `ENCRYPTION_KEY` | **Must exactly match backend** | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `CORS_ORIGIN` | `https://your-frontend.onrender.com` | ✅ |

> ⚠️ `JWT_SECRET` and `ENCRYPTION_KEY` **must be identical** across backend and git-service. If they differ, the git-service cannot verify user sessions or decrypt GitHub tokens saved by the backend.

---

### 5. Web Frontend

The Next.js application users interact with.

| Setting | Value |
|---------|-------|
| **Runtime** | Docker or Node |
| **Root Directory** (Node) | `web-frontend` |
| **Build Command** (Node) | `npm install && npm run build` |
| **Start Command** (Node) | `npm start` |

**Environment Variables:**

| Key | Value | Required |
|-----|-------|----------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api` | ✅ |
| `NEXT_PUBLIC_GIT_SERVICE_URL` | `https://your-git-service.onrender.com/api` | ✅ |
| `NEXT_PUBLIC_GITHUB_CLIENT_ID` | Same Client ID as backend | ✅ |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth Client ID (optional) | ❌ |
| `NODE_ENV` | `production` | ✅ |

---

### 6. Admin Panel

Owner-only dashboard for monitoring users, syncs, and system health.

| Setting | Value |
|---------|-------|
| **Root Directory** | `admin` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |

**Environment Variables:**

| Key | Value | Required |
|-----|-------|----------|
| `DATABASE_URL` | Same Neon URL | ✅ |
| `JWT_SECRET` | **Must match backend** | ✅ |
| `ADMIN_GITHUB_LOGINS` | Comma-separated GitHub usernames allowed access | ✅ |

---

## Environment Variables Reference

### Shared Secrets (Must Match Across Services)

These values **must be identical** in every service that uses them:

| Variable | Used By | Purpose |
|----------|---------|---------|
| `DATABASE_URL` | Backend, Git Service, Admin | PostgreSQL connection |
| `REDIS_URL` | Backend, Git Service | Redis connection |
| `JWT_SECRET` | Backend, Git Service, Admin | Signing/verifying auth tokens |
| `ENCRYPTION_KEY` | Backend, Git Service | Encrypting/decrypting GitHub tokens |

### Generating Secure Values

```bash
# Generate a JWT_SECRET (64 random characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate an ENCRYPTION_KEY (64 hex characters = 32 bytes)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## GitHub OAuth Setup

After deployment, update the GitHub OAuth App to point at the live URLs:

1. Go to **GitHub → Settings → Developer Settings → OAuth Apps**.
2. Click on your **CodeVault** app.
3. Update:
   - **Homepage URL:** `https://your-frontend.onrender.com`
   - **Authorization callback URL:** `https://your-frontend.onrender.com/login/callback`
4. Click **Update application**.

> ⚠️ The callback URL must **exactly** match the deployed frontend URL. A mismatch (even one letter) causes GitHub to show a "redirect_uri is not associated with this application" error.

---

## Post-Deployment Checklist

- [ ] All 4 services show **✅ Deployed / Live** on Render
- [ ] `DATABASE_URL` is set on: Backend, Git Service, Admin
- [ ] `REDIS_URL` is set on: Backend, Git Service (must start with `rediss://`)
- [ ] `JWT_SECRET` matches across: Backend, Git Service, Admin
- [ ] `ENCRYPTION_KEY` matches across: Backend, Git Service
- [ ] `CORS_ORIGIN` is set on: Backend, Git Service
- [ ] `CROSS_SITE_COOKIES=true` is set on: Backend
- [ ] GitHub OAuth callback URL points to the live frontend
- [ ] Login works end-to-end (GitHub → callback → dashboard)
- [ ] Database tables created (verified via `npx prisma db push` in build command)

---

## Bugs Fixed During Deployment

### 1. Next.js `output: "standalone"` → 404 on Render

**Symptom:** Frontend and Admin show a blank `Not Found` page after deployment.

**Root Cause:** Next.js standalone mode bundles a custom `server.js` file, but Render runs `npm start` (which calls `next start`), not `node .next/standalone/server.js`. The mismatch means the app starts but can't serve pages.

**Fix:** Remove `output: "standalone"` from `next.config.ts`:
```diff
  const nextConfig: NextConfig = {
-   output: "standalone",
  };
```

**Files Changed:**
- `web-frontend/next.config.ts`
- `admin/next.config.ts`

---

### 2. Next.js binding to `localhost` → Render can't route traffic

**Symptom:** Frontend shows `Not Found` even after removing standalone mode. Render's health check reports `x-render-routing: no-server`.

**Root Cause:** By default, `next start` only listens on `localhost` (127.0.0.1). Render's reverse proxy needs the app to listen on `0.0.0.0` (all network interfaces) to route internet traffic to it.

**Fix:** Update `package.json` start script to bind to `0.0.0.0`:
```diff
  "scripts": {
-   "start": "next start"
+   "start": "next start -H 0.0.0.0"
  }
```

**Files Changed:**
- `web-frontend/package.json`
- `admin/package.json`

---

### 3. Redis connection hang → 10-minute login times

**Symptom:** Clicking "Sign in with GitHub" takes 10+ minutes before finally timing out or succeeding.

**Root Cause:** The Redis client (ioredis) was configured with no connection timeouts and an offline queue enabled by default. When `REDIS_URL` pointed to `localhost` (the development fallback) or Upstash was slow to respond, every Redis command queued indefinitely instead of failing. The rate limiter middleware is designed to fail open on Redis errors, but a hang never produces an error — it just blocks the request forever.

**Fix:** Added explicit timeouts and disabled the offline queue in the Redis client configuration:
```typescript
// web-backend/src/lib/redis.ts
const redis = new Redis(redisUrl, {
  connectTimeout: 5000,    // 5 second connection timeout
  commandTimeout: 3000,    // 3 second per-command timeout
  maxRetriesPerRequest: 1, // fail fast, don't retry forever
  enableOfflineQueue: false // reject commands when disconnected
});
```

**Commit:** `c5863a2` — `fix: fail-fast Redis timeouts so slow Upstash cannot hang auth/rate-limited routes`

---

### 4. Missing `REDIS_URL` environment variable → silent connection failure

**Symptom:** Login hangs for 10+ minutes even after the timeout fix.

**Root Cause:** `REDIS_URL` was never added to the Render environment variables. The Dockerfile copies the repo's `.env` file which contains `REDIS_URL=redis://localhost:6380` — a development value that doesn't exist on Render. Combined with bug #3, this caused every Redis operation to hang.

**Fix:** Added the Upstash Redis URL (`rediss://...`) to both `codevault-backend` and `codevault-git-service` environment variables on Render.

---

### 5. Missing `CORS_ORIGIN` → API requests blocked

**Symptom:** Frontend can load pages but API calls fail silently. Login completes on GitHub's side but the token exchange fails.

**Root Cause:** Without `CORS_ORIGIN` set, the backend defaults to `https://codevault.io` in production mode (see `web-backend/src/app.ts`). Since the actual frontend runs on `your-frontend.onrender.com`, the browser blocks all cross-origin API requests.

**Fix:** Added `CORS_ORIGIN=https://your-frontend.onrender.com` to the backend environment variables on Render.

---

### 6. Missing `CROSS_SITE_COOKIES` → login cookies blocked by browser

**Symptom:** Login appears to succeed but user is immediately logged out. Dashboard shows "not authenticated" errors.

**Root Cause:** The frontend (`codevault-ig6c.onrender.com`) and backend (`codevault-backend-ig6c.onrender.com`) are on different subdomains. By default, cookies use `SameSite=strict`, which means the browser refuses to send the auth cookie from the frontend to the backend. Setting `CROSS_SITE_COOKIES=true` switches cookies to `SameSite=None; Secure`, allowing cross-subdomain cookie transmission over HTTPS.

**Fix:** Added `CROSS_SITE_COOKIES=true` to the backend environment variables on Render.

---

### 7. Difficulty chart colors — Easy and Medium looked identical

**Symptom:** On the dashboard's LeetCode difficulty ring, the Easy and Medium legend dots appeared the same color.

**Root Cause:** Easy used `--amber` (#e8a200, gold) and Medium used `--brand` (#f1543f, red-orange). On small 10px dots, these warm colors were visually indistinguishable.

**Fix:** Shifted to LeetCode-standard colors:
```diff
  :root {
+   --green: #00b8a3;
  }

- .sw.e{background:var(--amber)}  /* Easy = gold */
- .sw.m{background:var(--brand)}  /* Medium = red */
- .sw.h{background:var(--rose)}   /* Hard = pink */
+ .sw.e{background:var(--green)}  /* Easy = teal green */
+ .sw.m{background:var(--amber)}  /* Medium = gold/yellow */
+ .sw.h{background:var(--brand)}  /* Hard = red */
```

**Commit:** `03962fb` — `fix: use distinct LeetCode colors for difficulty (green/amber/red)`

---

## Known Limitations (Free Tier)

### Cold Starts (30–90 seconds)

Render's free tier spins services down after **15 minutes of inactivity**. The first request after idle triggers a cold start:

| Service | Cold Start Time |
|---------|----------------|
| Frontend | ~30s |
| Backend | ~25s |
| Neon (Postgres) | ~5-10s |

**Combined worst case:** First login after idle takes 60–90 seconds.

**Mitigation:** Set up a free [UptimeRobot](https://uptimerobot.com) monitor that pings `https://your-backend.onrender.com/api/health` every 10 minutes. This keeps the backend warm and eliminates most cold starts.

### Render Free Tier Limits

- **750 hours/month** per account (shared across all services)
- Services spin down after 15 minutes of no traffic
- No persistent disk storage
- Limited to Oregon region

---

## Troubleshooting

### "Not Found" — blank page on frontend

1. Check if `output: "standalone"` was removed from `next.config.ts`.
2. Check if `package.json` start script includes `-H 0.0.0.0`.
3. Check Render logs for build errors.

### "redirect_uri is not associated with this application"

The GitHub OAuth callback URL doesn't match the deployed frontend URL. Go to GitHub → Developer Settings → OAuth Apps and update the callback URL.

### "Authentication failed (500)"

1. Check Render logs for the backend — look for the actual error.
2. Verify `DATABASE_URL` points to a working Neon database.
3. Verify `REDIS_URL` starts with `rediss://` (not `redis://`).
4. Run `npx prisma db push` to ensure tables exist.

### Login takes forever (10+ minutes)

1. Check if `REDIS_URL` is set in the backend environment.
2. Verify it starts with `rediss://` (TLS required by Upstash).
3. Trigger a Manual Deploy to pick up the Redis timeout fix (`c5863a2`).

### User appears logged out immediately after login

1. Check if `CROSS_SITE_COOKIES=true` is set on the backend.
2. Check if `CORS_ORIGIN` matches the exact frontend URL.
3. Open browser DevTools → Network tab → look for blocked cookies or CORS errors.

### "User not found" on public profiles

The Neon database is empty after first deploy. Users need to log in once on the live site to create their accounts, then re-connect their coding platforms.
