<div align="center">

# 🧩 CodeVault — Browser Extension

### Capture your accepted solutions at the source, in any browser.

A cross-browser **WebExtension (Manifest V3)** that detects when *you* get an **Accepted** submission on a supported platform, captures the problem + your source code from the page you are already signed in to, and hands it to the [git-service](../git-service) — which runs the existing GitHub-push pipeline unchanged. Signs in as the **same CodeVault user** (GitHub identity) used by the website.

</div>

---

> ⚠️ **This folder is a planning skeleton — no extension code yet.** This README and [`../docs/EXTENSION_PLAN.md`](../docs/EXTENSION_PLAN.md) are the source of truth for the architecture. Build module-by-module like the other services.

---

## 📑 Table of Contents

1. [Why an extension (Path B v2)](#-why-an-extension-path-b-v2)
2. [Where it sits](#-where-it-sits)
3. [Cross-browser strategy](#-cross-browser-strategy)
4. [Login — same CodeVault user](#-login--same-codevault-user)
5. [Capture flow](#-capture-flow)
6. [Tech stack](#-tech-stack)
7. [Planned folder structure](#-planned-folder-structure)
8. [Permissions (least-privilege)](#-permissions-least-privilege)
9. [Backend touch-points](#-backend-touch-points)
10. [Rules & conventions](#-rules--conventions)

---

## 🎯 Why an extension (Path B v2)

CodeVault originally **avoided** a browser extension and fetched code server-side by replaying a one-time platform session token (**Path B**). That approach is fragile: tokens expire silently, break on platform changes, and brush against scraping ToS.

The extension is **Path B v2 — capture-at-source**: because you are already authenticated in your own browser when you solve a problem, the extension reads *your own* accepted code from the page and pushes it. No server-side session replay, no stored platform passwords.

> 📌 Path A (public stats by username) is **unchanged** and needs no extension. The extension only improves how private code (Path B) reaches GitHub.

---

## 🧭 Where it sits

```
┌─────────────────┐   captures your own accepted code
│ browser-extension│ ─────────────┐
└─────────────────┘               │ REST + JWT
                                  ▼
web-frontend ──REST──▶ web-backend (auth: issues the extension token)
             └─REST──▶ git-service (POST /api/ingest → GitHub push)
                                  │
                                  ▼
                         GitHub REST API → user's repo
```

The extension authenticates against **web-backend** (same GitHub user) and sends captured submissions to **git-service**, reusing its existing GitHub-push + README-index logic.

---

## 🌐 Cross-browser strategy

| Target | How |
|--------|-----|
| Chrome · Edge · Brave · Opera · Arc | **Manifest V3** directly (Chromium) |
| Firefox | Same MV3 source + `browser_specific_settings`; minor background/event differences |
| Safari | Wrapped via `xcrun safari-web-extension-converter` → ships through the **App Store** (needs an Apple Developer account) |

- One codebase against the **WebExtensions API** + `webextension-polyfill` (so `browser.*` works everywhere).
- A build framework (**WXT** or **CRXJS + Vite**) emits per-target bundles from one source.
- Chromium + Firefox cover most users from a single artifact; **Safari is a later milestone** (Apple review friction).

---

## 🔐 Login — same CodeVault user

The extension signs in as the **same GitHub-identity user** as the website (one `users` row, no separate account).

1. User clicks **Sign in** in the popup.
2. Extension opens web-backend `/api/auth/extension/start?challenge=…` (PKCE-style) via `launchWebAuthFlow`.
3. User completes the **normal GitHub OAuth** flow (same user).
4. Backend returns a one-time **authorization code** to the extension.
5. Extension exchanges it at `/api/auth/extension/token` for a **JWT access token + rotating refresh token** (same token shape the services already issue).
6. Tokens are stored in `chrome.storage.local`, rotated, and **revocable** from Settings.

**Reuses what already exists:** refresh rotation + reuse-detection (web-backend) and same-JWT verification (git-service S1). The extension gets a dedicated `client = extension` session so it can be revoked independently of the website cookie.

---

## 🛰️ Capture flow

```
[content script]  detects "Accepted" (intercept platform network response; DOM fallback)
       │           extracts: number, slug, title, difficulty, tags, language, your code
       ▼
[background SW]   normalizes → SolutionToSync
       │           POST /api/ingest  (Authorization: Bearer <JWT>)
       ▼
[git-service]     verify JWT → ownership check → dedupe vs problems table
       │           → existing GitHub push (<number>/question.md + solution.<ext>)
       ▼
       └─ README index regenerated · dashboard reflects new synced problem
```

Build **LeetCode end-to-end first**, then fan out to Codeforces, CodeChef, HackerRank.

---

## 🛠 Tech stack

| Layer | Technology |
|-------|-----------|
| Manifest | **Manifest V3** (service worker background) |
| API | **WebExtensions API** + `webextension-polyfill` |
| Language | **TypeScript** `5.5.x` |
| Build | **WXT** *or* **CRXJS + Vite** (per-target bundles) |
| Auth | GitHub OAuth handoff → JWT (same as web-backend) |
| Transport | `fetch` to web-backend (auth) + git-service (ingest) |

---

## 📁 Planned folder structure

```
browser-extension/
├── package.json
├── tsconfig.json
├── wxt.config.ts                 # or vite + CRXJS
├── manifest.config.ts            # MV3 manifest (host_permissions per platform)
├── .env.example                  # API base URLs (no secrets)
│
├── src/
│   ├── background/
│   │   └── index.ts              # service worker: auth state, ingest dispatch
│   ├── content/
│   │   ├── leetcode.ts           # detect accepted + capture code
│   │   ├── codeforces.ts
│   │   ├── codechef.ts
│   │   └── hackerrank.ts
│   ├── popup/                    # sign-in status, toggles, recent captures, "Sync now"
│   ├── options/                  # account, capture prefs, repo target, revoke sessions
│   ├── lib/
│   │   ├── auth.ts               # PKCE flow, token storage + refresh
│   │   ├── api-client.ts         # web-backend + git-service base URLs
│   │   ├── capture.ts            # shared normalize → SolutionToSync
│   │   └── storage.ts            # chrome.storage.local wrappers
│   ├── types/                    # Submission, Capture, SolutionToSync (mirror git-service)
│   └── constants/                # platform host patterns, selectors/endpoints
│
└── tests/
    └── .gitkeep
```

---

## 🔒 Permissions (least-privilege)

- `host_permissions`: only the four platform domains **+** the CodeVault API domain (never `<all_urls>`)
- `permissions`: `storage`, `scripting`, `identity`
- Strict `content_security_policy`; **no remote code**
- Capture only the signed-in user's **own accepted** submissions

---

## 🔗 Backend touch-points

| Service | New endpoint | Purpose |
|---------|-------------|---------|
| web-backend | `POST /api/auth/extension/start` | begin PKCE OAuth handoff |
| web-backend | `POST /api/auth/extension/token` | exchange code → JWT pair |
| web-backend | `POST /api/auth/extension/refresh` | rotate (reuse existing rotation) |
| web-backend | `GET /api/auth/extension/sessions` · `DELETE /…/:id` | list / revoke extension sessions |
| git-service | `POST /api/ingest` | accept captured submission(s); reuse JWT verify + GitHub push |

DB: add a `client` discriminator (`web` \| `extension`) to `auth_sessions`; optional `ingest_log` for idempotency. **No change** to the GitHub-push core.

See [`../docs/EXTENSION_PLAN.md`](../docs/EXTENSION_PLAN.md), [`../docs/EXTENSION_SECURITY.md`](../docs/EXTENSION_SECURITY.md), and [`../docs/API_CONTRACT.md`](../docs/API_CONTRACT.md).

---

## 📐 Rules & conventions

1. **Same user, same backend** — never a separate account or auth system; reuse web-backend identity + JWT.
2. **Own-data-only** — capture only the user's own accepted submissions, with consent.
3. **Least-privilege manifest** — scope host permissions to the four platforms + the API domain.
4. **No secrets in the bundle** — only public API base URLs; tokens live in `chrome.storage.local`.
5. **Reuse, don't duplicate** — git-service owns the GitHub push; the extension only feeds it.
6. **Commits:** small, prefixed (`feat:`, `fix:`, `chore:`, `docs:`); authored solely by the project owner — no co-authors.
