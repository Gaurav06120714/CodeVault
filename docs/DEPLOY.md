<div align="center">

# 🚀 CodeVault — Deploy free on Render (Mac off, no card)

</div>

> Free, works with your Mac off, sign in with GitHub (no card). Uses the `render.yaml` Blueprint
> in this repo — Render provisions Postgres + Redis + all 3 services in a few clicks.
>
> **One caveat:** free services **sleep after ~15 min idle** and take ~50s to wake on the next
> visit. Fine for a friend opening the link to review; the extension may miss a capture while the
> backend is asleep.

## The shape
```
https://codevault.onrender.com ─▶ web-frontend ──/api──▶ codevault-backend
   (the one public URL)                          └/gitapi─▶ codevault-git
                                                  + Postgres + Redis
```
Same-origin behind the frontend, so login cookies + CSRF just work.

---

## Step 1 — Sign up
Go to **render.com** → **Sign up with GitHub** (no card). Authorize Render to read your repo.

## Step 2 — Create the Blueprint
Dashboard → **New +** → **Blueprint** → pick the **CodeVault** repo → Render reads `render.yaml`
and shows the services (backend, git, frontend, Postgres, Redis).

## Step 3 — Fill the secrets it asks for
Render will prompt for the `sync: false` values. Set:
| Key | Value |
|---|---|
| `ENCRYPTION_KEY` (in the **codevault-secrets** group) | a 64-hex string — run `openssl rand -hex 32` |
| `GITHUB_CLIENT_SECRET` (backend) | your GitHub OAuth secret |
| `GOOGLE_CLIENT_SECRET` (backend) | your Google OAuth secret |

(`JWT_SECRET` auto-generates and is shared; `ENCRYPTION_KEY` must be the **same** for backend + git — the group handles that.)

Click **Apply** → Render builds and deploys everything (first build ~5–10 min).

## Step 4 — Create the DB schema (once)
Open **codevault-backend → Shell** (in the Render dashboard) and run:
```
npx prisma db push
```

## Step 5 — Point OAuth at the live URL
Your app is at **`https://codevault.onrender.com`** (name may differ if taken).
- **GitHub** OAuth App → callback URL: `https://codevault.onrender.com/login/callback`
- **Google** OAuth client → redirect URI: `https://codevault.onrender.com/login/callback/google` + JS origin `https://codevault.onrender.com`

## Step 6 — Extension for the live backend
On your Mac, rebuild the extension pointed at the deployed URL, then load `dist/` unpacked:
```bash
cd browser-extension
VITE_API_URL="https://codevault.onrender.com/api" \
VITE_GIT_SERVICE_URL="https://codevault.onrender.com/gitapi" \
VITE_WEB_APP_URL="https://codevault.onrender.com" \
npm run build
```
(Also update the background worker's hardcoded `http://localhost:3000` origin check to the live URL.)

---

## Updating later
Push to `main` → Render **auto-deploys** the changed services (Blueprints have auto-deploy on).

## Notes
- Free Postgres is deleted after ~30 days of the free plan — fine for a review, upgrade later if you keep it.
- If a service shows a build error, open its **Logs** in Render and paste it to me — I'll fix it.

---

> Prefer a truly-always-on (no sleep) free host later? The repo also ships `docker-compose.prod.yml`
> + `Caddyfile` for an Oracle Cloud "Always Free" VM — see the git history of this file.
