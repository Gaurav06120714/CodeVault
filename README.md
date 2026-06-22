<div align="center">

# 🗄️ CodeVault

### Your entire coding journey — unified, organized, and automated.

CodeVault brings every competitive‑programming platform you use into **one dashboard**, and automatically publishes your accepted solutions to a **clean, searchable GitHub repository** — no browser extension, no copy‑pasting code for every problem.

</div>

---

## 📑 Table of Contents

1. [What is CodeVault?](#-what-is-codevault)
2. [Why it exists](#-why-it-exists)
3. [Core features](#-core-features)
4. [How it works — the two data paths](#-how-it-works--the-two-data-paths)
5. [Tech stack & versions](#-tech-stack--versions)
6. [Folder structure](#-folder-structure)
7. [File‑by‑file guide](#-file-by-file-guide)
8. [Project rules & conventions](#-project-rules--conventions)
9. [Getting started](#-getting-started)
10. [Roadmap](#-roadmap)
11. [Ethics & limitations](#-ethics--limitations)
12. [Author](#-author)

---

## 🧩 What is CodeVault?

When you solve problems on LeetCode, Codeforces, CodeChef, or HackerRank, all that hard work stays trapped — split across different sites, hidden behind logins, and impossible to show off in one place.

**CodeVault fixes that.** It:

- Pulls your **public stats** from every platform into a single dashboard.
- Automatically copies your **accepted solutions** into a well‑organized GitHub repo with an auto‑generated index, so anyone (a recruiter, a friend, or future‑you) can search a problem and instantly see how you solved it.

> 📌 This repository currently holds the **project skeleton** — the full folder structure and an empty file for every planned module. Code is added module‑by‑module as the project is built. This README is the single source of truth for the architecture.

---

## 💡 Why it exists

| Problem | CodeVault's answer |
|--------|--------------------|
| Progress is scattered across many sites | One unified, multi‑platform dashboard |
| Solutions are locked behind logins | Auto‑published to a public GitHub repo |
| Solved problems don't build a portfolio | The repo becomes a living "coding résumé" |
| Existing tools are single‑platform & need an extension | Multi‑platform, **no extension required** |

---

## ✨ Core features

- 📊 **Unified stats dashboard** — total solved, difficulty & topic breakdown, streaks, rankings, heatmap.
- 🔄 **Auto‑sync to GitHub** — solutions organized into folders + a README index (problem no, title, type, difficulty, language, date, link).
- 🔐 **Connect once, automate forever** — authorize a platform a single time; syncing then runs on a schedule.
- 🤖 **(Planned) AI layer** — auto‑explain solutions, auto‑tag problem type, recommend the next problem by your weakest topic.

---

## 🧠 How it works — the two data paths

CodeVault is built on one key insight: **public stats and private source code are two different kinds of data**, so they travel two independent paths. If one breaks, the other still works.

### Path A — Statistics *(username only)*
- **Input:** a public username / profile link.
- **Source:** public endpoints (LeetCode GraphQL, Codeforces official API…).
- **Auth:** none. Always available, fully legal.

### Path B — Code sync *(one‑time authorized connect)*
- **Input:** an authorized session you grant **once** per platform.
- **Source:** *your own* accepted submissions, including source code.
- **Auth:** required once — syncing is automatic thereafter.

```
Public username ───▶ Stats Poller ──────────▶ Unified Dashboard
One-time connect ──▶ Submission Fetcher ──▶ Organizer ──▶ GitHub API ──▶ Public Repo + README
```

> ⚠️ **Honest truth:** a username alone can fetch *stats* but **never your source code** — submitted code is private on every platform. Path B exists precisely to solve that, with your explicit consent, touching only your own data.

---

## 🛠 Tech stack & versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | **Next.js** (App Router) | `15.x` |
| Language | **TypeScript** | `5.5.x` |
| UI library | **React** | `18.3.x` |
| Styling | **Tailwind CSS** | `3.4.x` |
| ORM | **Prisma** | `5.18.x` |
| Database | **SQLite** (dev) → Postgres (prod) | — |
| External APIs | GitHub REST API, LeetCode GraphQL, Codeforces API | — |
| Runtime | **Node.js** | `≥ 18.18` |

---

## 📁 Folder structure

```
CodeVault/
├── README.md                  # ← you are here (the single source of truth)
├── .gitignore                 # files git should ignore
├── .env.example               # template for required environment variables
├── package.json               # dependencies, scripts, project metadata
├── tsconfig.json              # TypeScript compiler config + @/* path alias
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind theme & content paths
├── postcss.config.mjs         # PostCSS pipeline (Tailwind + autoprefixer)
│
├── prisma/
│   └── schema.prisma          # database models: User, Connection, Problem
│
├── docs/
│   └── ARCHITECTURE.md         # deep‑dive on the two data paths
│
└── src/
    ├── app/                   # Next.js App Router (pages + API)
    │   ├── layout.tsx         # root layout (html shell, metadata)
    │   ├── page.tsx           # dashboard home page
    │   ├── globals.css        # global styles / Tailwind directives
    │   └── api/
    │       └── sync/
    │           └── route.ts    # POST endpoint that triggers a sync run
    │
    └── lib/                   # reusable logic (no UI)
        ├── db.ts             # shared Prisma database client
        ├── platforms/         # one file per coding platform
        │   ├── leetcode.ts    # LeetCode stats + authorized code fetch
        │   └── codeforces.ts  # Codeforces stats via official API
        └── github/
            └── sync.ts        # organize solutions + push to GitHub + build index
```

---

## 📄 File‑by‑file guide

### Root config
| File | What it does |
|------|--------------|
| `README.md` | Project overview, architecture, and the single source of truth. |
| `.gitignore` | Tells git which files to skip (`node_modules`, `.env`, build output, local DB). |
| `.env.example` | Template listing every environment variable needed (DB URL, GitHub token, platform session keys). Copy to `.env` and fill in. |
| `package.json` | Declares dependencies, versions, and npm scripts (`dev`, `build`, `db:push`…). |
| `tsconfig.json` | TypeScript rules and the `@/*` import alias pointing at `src/`. |
| `next.config.mjs` | Next.js framework settings. |
| `tailwind.config.ts` | Tailwind theme tokens (colors) and which files to scan for classes. |
| `postcss.config.mjs` | Runs Tailwind + autoprefixer when building CSS. |

### Database
| File | What it does |
|------|--------------|
| `prisma/schema.prisma` | Defines the data models — **User** (account), **Connection** (a linked platform + optional authorized session), **Problem** (a solved problem and whether it's been synced to GitHub). |

### Application (`src/app`)
| File | What it does |
|------|--------------|
| `app/layout.tsx` | The root HTML shell wrapping every page; sets page title/metadata and loads global CSS. |
| `app/page.tsx` | The dashboard home page — shows stat cards and connected platforms. |
| `app/globals.css` | Global styles and Tailwind directives. |
| `app/api/sync/route.ts` | Backend endpoint (`POST /api/sync`) that runs a sync: fetch new accepted submissions and push unsynced ones to GitHub. Called manually and on a schedule. |

### Library logic (`src/lib`)
| File | What it does |
|------|--------------|
| `lib/db.ts` | Creates and shares a single Prisma database client across the app. |
| `lib/platforms/leetcode.ts` | **Path A:** fetch public LeetCode stats by username. **Path B:** fetch the authorized user's own accepted submissions + source code. |
| `lib/platforms/codeforces.ts` | Fetch Codeforces stats (rating, rank, solved count) via the official public API. |
| `lib/github/sync.ts` | Builds the organized file path for a solution, pushes it to GitHub via the REST API, and regenerates the repo's README index table. |

---

## 📐 Project rules & conventions

1. **One responsibility per file** — UI lives in `src/app`, logic lives in `src/lib`. Never mix them.
2. **Each coding platform = its own file** under `src/lib/platforms/`. Adding a new platform means adding one file, nothing else.
3. **Two data paths stay separate** — public stats (Path A) must never depend on an authorized session (Path B), so the dashboard keeps working even if a session expires.
4. **Secrets only in `.env`** — never commit real tokens. `.env.example` documents the keys; `.env` is git‑ignored.
5. **Imports use the `@/` alias** — e.g. `import { db } from "@/lib/db"`, not long relative paths.
6. **Commit style:** small, focused commits using prefixes — `feat:`, `fix:`, `chore:`, `docs:`, `style:`. One logical change per commit.
7. **Author attribution:** every commit is authored solely by the project owner — **no co‑authors**.
8. **Consent first:** the app only ever accesses the user's *own* data, with explicit authorization. No scraping of other people's code.
9. **Graceful failure:** when a session expires, show a "Reconnect" prompt — never crash or fail silently.

---

## 🚀 Getting started

> The repository is currently a skeleton. Once modules are implemented, the flow will be:

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env       # then fill in DATABASE_URL, GITHUB_TOKEN, etc.

# 3. Set up the database
npx prisma db push

# 4. Run the dev server
npm run dev                # open http://localhost:3000
```

---

## 🗺 Roadmap

- [x] Project skeleton, folder structure & architecture
- [ ] LeetCode stats (Path A) → dashboard
- [ ] Codeforces stats (official API)
- [ ] LeetCode code sync (Path B) → GitHub push + README index
- [ ] Unified multi‑platform dashboard
- [ ] AI explanation & next‑problem recommendation
- [ ] Gamification (streaks, goals, shareable cards)

---

## ⚖️ Ethics & limitations

- CodeVault accesses **only your own data**, with your explicit authorization.
- **Source code is private on every platform** — it can never be fetched from a username alone; Path B (one‑time connect) is the only honest way to get it.
- Session tokens **expire** periodically; the app detects this and prompts a clean re‑connect while the stats dashboard keeps working.
- Uses official **GitHub OAuth / tokens** — never handles raw platform passwords.

---

## 👤 Author

**Gaurav Ganesh Teegulla** — [@Gaurav06120714](https://github.com/Gaurav06120714)

<div align="center">

⭐ If you find CodeVault useful, consider starring the repo!

</div>
