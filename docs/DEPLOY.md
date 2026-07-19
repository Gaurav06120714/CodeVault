<div align="center">

# 🚀 CodeVault — Deploy to Fly.io (always-on, free HTTPS, no domain)

</div>

> Goal: host CodeVault so it runs with your Mac **off**, has a public HTTPS link to share, keeps the
> **browser extension** working anytime, and persists login. No domain purchase — Fly gives free
> `*.fly.dev` subdomains. Not Vercel/Railway.

## Why this architecture (read once)

Splitting the frontend and backend onto separate `*.fly.dev` apps makes them **cross-site**, which
breaks the httpOnly session cookie and the CSRF double-submit (a page can't read a cookie set on a
different domain). **Fix without a domain: a same-origin proxy.** The frontend proxies `/api/*` to
web-backend and `/gitapi/*` to git-service, so the **browser only ever talks to one origin**
(`your-app.fly.dev`). Cookies stay same-origin, CSRF works, no CORS headaches.

```
browser ─▶ codevault.fly.dev ──/api/*──▶ web-backend (private)
                              └─/gitapi/*─▶ git-service (private)
extension ─▶ codevault.fly.dev/api/auth/extension-token  (mint JWT)
          └▶ codevault.fly.dev/gitapi/ingest             (push captures)
```

So you deploy **4 apps** (web-frontend, web-backend, git-service, admin) + **Postgres** + **Redis**.
Only web-frontend and admin need public access; the two backends can be internal.

---

## 0. One-time setup

```bash
brew install flyctl        # or: curl -L https://fly.io/install.sh | sh
fly auth signup            # free; needs a card for abuse-prevention, but the small VMs are free-tier
```

## 1. Provision the data layer (managed, always-on)

```bash
fly postgres create --name codevault-db            # note the connection string it prints
fly redis create       --name codevault-redis      # Upstash Redis; note its URL
```

## 2. Deploy the two backends

Each already has a Dockerfile. From each folder:

```bash
cd web-backend
fly launch --no-deploy --name codevault-backend    # generates/uses fly.toml (already in repo)
fly postgres attach codevault-db                    # sets DATABASE_URL
fly secrets set \
  JWT_SECRET="<64+ random chars>" \
  ENCRYPTION_KEY="<64 hex chars — MUST match git-service>" \
  REDIS_URL="<from step 1>" \
  GITHUB_CLIENT_ID="<oauth app id>" \
  GITHUB_CLIENT_SECRET="<oauth app secret>" \
  NODE_ENV="production" \
  CORS_ORIGIN="https://codevault.fly.dev"
fly deploy

cd ../git-service
fly launch --no-deploy --name codevault-git
fly postgres attach codevault-db
fly secrets set JWT_SECRET="<same as backend>" ENCRYPTION_KEY="<same 64 hex>" REDIS_URL="<from step 1>" NODE_ENV="production"
fly deploy
```

> `JWT_SECRET` and `ENCRYPTION_KEY` **must be identical** across web-backend and git-service — they
> verify the same JWTs and decrypt the same tokens.

## 3. Deploy the frontend (the public one, with the proxy)

The frontend proxies to the backends via env vars (see `web-frontend/next.config.ts`):

```bash
cd ../web-frontend
fly launch --no-deploy --name codevault      # → https://codevault.fly.dev
fly secrets set \
  BACKEND_URL="https://codevault-backend.fly.dev" \
  GIT_URL="https://codevault-git.fly.dev" \
  NEXT_PUBLIC_API_URL="/api"                  # relative → hits the same-origin proxy
fly deploy
```

## 4. Deploy admin (optional)

```bash
cd ../admin
fly launch --no-deploy --name codevault-admin
fly postgres attach codevault-db
fly secrets set JWT_SECRET="<same>" NODE_ENV="production"
fly deploy
```

## 5. GitHub OAuth callback

In your GitHub OAuth App settings, set **Authorization callback URL** to:
```
https://codevault.fly.dev/login/callback
```

## 6. Rebuild + reload the extension against production

```bash
cd browser-extension
VITE_API_URL="https://codevault.fly.dev/api" \
VITE_GIT_SERVICE_URL="https://codevault.fly.dev/gitapi" \
VITE_WEB_APP_URL="https://codevault.fly.dev" \
npm run build
```
Then load `dist/` unpacked in Chrome (or zip it for your friend to load). Update the background
worker's origin check to the prod frontend URL (see `browser-extension/src/background/index.ts`).

---

## Making changes later

Fly does **not** auto-deploy. After a code change, `fly deploy` from that service's folder. To
auto-deploy on push to `main`, add a GitHub Action (`flyctl deploy`) with a `FLY_API_TOKEN` secret —
ask and I'll scaffold it.

## Cost

The small `shared-cpu-1x` VMs and the free Postgres/Redis allowances cover a review/testing setup at
~$0. Always-on (no sleep), so the extension and cron keep working with your Mac off.

## Sharing with a friend for review

Send them **`https://codevault.fly.dev`** (public profile `…/u/<handle>` needs no login). For the
extension, send them the built `dist/` folder to load unpacked — but note it captures *their* solves
under *their* login, so they'd sign in once on the site first.
