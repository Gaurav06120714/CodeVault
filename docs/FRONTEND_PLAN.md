# 🎨 CodeVault — Frontend Development Blueprint

> Senior Frontend Architect plan. **Planning only — no code.** The approved prototype in [`/frontendHtml`](../frontendHtml/README.md) (15 pages, coral/gold/rose theme) is the **final UI reference**. This blueprint plans how to build it as the production `web-frontend` (Next.js 16 · App Router · TypeScript · Tailwind), preserving the design language exactly.

**Target stack (fixed by the project):** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4. **Server state:** TanStack Query (React Query). **Forms:** React Hook Form + Zod. Talks to **two backends** (web-backend, git-service).

> 🧭 **Live status:** this is the *plan*. What's actually built — which pages call real APIs vs. still render mock data, per-page owners, and gaps — is tracked in **[FEATURES.md](FEATURES.md)**. The shipped `web-frontend` runs **Next 16.2.9 / React 19.2.4 / Tailwind 4**; any older "Next 15 / React 18" mention below is superseded.

---

## 0. Architect's read on the design

The prototype is consistent and component-friendly: **three layout shells** (public marketing, split auth, app sidebar+topbar) and a tight set of repeated widgets (StatCard, DifficultyRing, ContributionHeatmap, PlatformBar, SubmissionsTable, Switch, SegmentedControl, badges). That repetition is the backbone of the component library below.

Design language is **locked**. The only changes I recommend are **non-visual usability/accessibility** additions (loading/empty/error states, toasts, confirm dialogs, focus management, reduced-motion) — none alter the look. See §9.

---

## 1. Overall Frontend Architecture

### 1.1 Application architecture
- **Next.js App Router**, feature-first organization, **Server Components by default** with **client islands** only where interactivity is needed (drawer, toggles, charts, forms, copy buttons).
- **Why:** the app is content + dashboards. RSC keeps JS small; client components are surgical. App Router gives per-route layouts, streaming, and built-in loading/error boundaries that map 1:1 to the prototype's shells.

### 1.2 Rendering strategy (per surface)
| Surface | Strategy | Why |
|--------|----------|-----|
| Landing, Privacy, Terms | **Static (SSG)** | Pure content; fastest, cacheable, SEO. |
| Public profile `/u/[username]` | **SSR + ISR** (revalidate) | Must be shareable + SEO-indexed; data changes slowly. |
| Problem detail `/p/[platform]/[number]` | **SSR** | Shareable/SEO; mostly read. |
| Login, Contact | **Static shell + client form** | Minimal data; interactive form. |
| App pages (overview, analytics, repositories, settings, sync, notifications, connect, manage-profile) | **Client-rendered behind auth** (RSC shell + client data islands) | Personal, auth-gated, highly interactive; no SEO value. |

### 1.3 Component hierarchy (top level)
```
RootLayout (fonts, theme tokens, providers)
├── (marketing) PublicLayout → Navbar + Footer
│     └── Landing / Privacy / Terms / Contact / Profile(public)
├── (auth) AuthLayout → split brand panel + form slot
│     └── Login
└── (app) AppLayout → Sidebar + Topbar + MobileDrawer + content
      └── Overview / Analytics / Repositories / ManageProfile /
          SyncStatus / Settings / Notifications / Connect / ProblemDetail
```

### 1.4 Page hierarchy
```
/                      landing            (public)
/login                 login              (public)
/u/[username]          public profile     (public, SSR/ISR)
/privacy /terms /contact                  (public)
/app (or /dashboard)   overview           (protected)
  /analytics
  /repositories
  /repositories/[...]  → /p/[platform]/[number]  problem detail
  /profile             manage public profile
  /sync                sync status
  /settings (#sections)
  /notifications
  /connect             connect platform flow
```

### 1.5 Data flow
```
Server Component / route loader ──fetch──▶ services/api-client ──▶ backend
        │ (initial data, SSR/RSC)
        ▼
Client island hydrates ──React Query──▶ same api-client ──▶ backend
        │ (refetch, mutations, cache)
        ▼
UI components (presentational, props-driven)
```
- **One-way data flow:** data enters at the route/feature level, flows down via props; events flow up via callbacks/mutations.
- **Two API bases:** `web-backend` (auth/stats/profiles) and `git-service` (sync) — abstracted behind one typed client with two configured instances.

### 1.6 State flow (summary; detail in §6)
```
Auth/session  → global (context + cookie)        ─┐
Theme         → global (context, light default)   ├─ providers in RootLayout
UI (drawer, modals, toasts) → global (lightweight) ┘
Server data (stats, connections, sync, notifications, profile) → React Query cache
Form data     → React Hook Form (local to form)
Component UI (accordion open, segmented index) → local useState
```

### 1.7 Routing strategy
- **Route groups** separate the three shells: `(marketing)`, `(auth)`, `(app)` — each with its own `layout.tsx`. Mirrors the prototype's three layouts exactly.
- **Middleware** guards `(app)` routes (redirect to `/login` if unauthenticated) and bounces authed users away from `/login`.
- **Dynamic segments:** `[username]`, `[platform]`/`[number]`.

### 1.8 Scalability considerations
- **Feature folders** keep modules independent → many devs, few conflicts.
- **Design-system package** (`components/ui`) is the stable core; features compose it.
- **Typed API client + generated/shared DTOs** prevent drift as endpoints grow.
- New platform/page = new feature folder + reuse UI kit; no architecture change.

---

## 2. Analysis of the Approved Design

### 2.1 Pages (15)
Landing, Login, Overview, Analytics, Repositories, Manage Public Profile, Sync Status, Settings, Notifications, Connect, Problem Detail, Public Profile (visitor), Privacy, Terms, Contact.

### 2.2 Layouts (3)
- **PublicLayout** — sticky `Navbar` + page + `Footer`.
- **AuthLayout** — split: brand panel (hidden on mobile) + form slot.
- **AppLayout** — `Sidebar` + `Topbar` + `MobileDrawer` + scrollable content.

### 2.3 Sections (mostly Landing)
Hero, PlatformStrip, ProblemSection, SolutionSteps, DashboardPreview, GitHubSyncFlow, RepoTree, PublicProfileShowcase, HowItWorks, FounderStory, FAQ, FinalCTA. Plus app section blocks: ProfileHeader, StatRow, panel grids.

### 2.4 Component inventory → reusability

| Element | Component | Reusable? | Used on |
|---|---|---|---|
| Logo | `BrandMark` | ✅ everywhere | all |
| Sidebar nav | `Sidebar`, `NavItem` | ✅ | app pages |
| Topbar | `Topbar`, `IconButton` | ✅ | app pages |
| Mobile drawer | `MobileDrawer` | ✅ | app pages |
| Buttons | `Button` (primary/secondary/ghost/danger), `IconButton` | ✅ core | all |
| Stat tile | `StatCard`, `StatsGrid` | ✅ | overview, analytics, public |
| Difficulty donut | `DifficultyRing` | ✅ | overview, analytics, public |
| Heatmap | `ContributionHeatmap` | ✅ | overview, public |
| Platform bars | `PlatformBreakdown`, `PlatformBar` | ✅ | overview, analytics, public |
| Topic tags | `TopicChips`, `Chip` | ✅ | overview, analytics, public |
| Skill badge | `SkillBadge` | ✅ | overview |
| Submissions table | `DataTable` + `SubmissionsTable` | ✅ generic table | overview, sync |
| Difficulty/status pill | `Pill` / `Badge` | ✅ | tables, profile |
| Platform icon/handle | `PlatformBadge`, `PlatformChip` | ✅ | many |
| Profile header | `ProfileHeader` (app + public variants) | ✅ | overview, public, manage-profile |
| Toggle | `Switch` | ✅ | settings, manage-profile |
| Segmented control | `SegmentedControl` | ✅ | analytics filter, theme |
| Form inputs | `Input`, `Select`, `Textarea`, `FormField`, `Label` | ✅ | settings, contact, connect, login |
| Repo header | `RepoHeader` | ➖ feature | repositories |
| File list | `FileList`, `FileRow` | ➖ feature | repositories |
| Commit list | `CommitList` | ➖ feature | repositories |
| Repo mapping | `RepoMappingRow` | ➖ feature | repositories |
| Activity/log list | `ActivityLog`, `LogRow` | ✅ (sync log + notifications share it) | sync, notifications |
| Connection status row | `ConnectionRow`, `StatusPill` | ✅ | sync, settings |
| Health banner | `HealthBanner` | ➖ feature | sync |
| FAQ | `FAQ`, `FAQItem` (accordion) | ➖ marketing | landing |
| Code block | `CodeBlock` | ➖ feature | problem detail, landing repo tree |
| Question panel | `QuestionPanel` | ➖ feature | problem detail |
| Platform picker | `PlatformPickerCard`, `ConnectModeCard` | ➖ feature | connect |
| Copy button | `CopyButton` | ✅ | profile, manage-profile |
| Live preview card | `ProfilePreviewCard` | ➖ feature | manage-profile |
| Pricing plan card | `PlanCard` | ⏸ deferred (pricing removed) | — |

### 2.5 Forms / Tables / Nav / Overlays
- **Forms:** Login, Contact, Settings (account + many controls), Connect (username).
- **Tables:** Submissions (overview/sync), Connections (sync/settings), File list (repositories).
- **Navigation:** public `Navbar`, app `Sidebar`, `Topbar`, settings sub-nav (scroll-spy), mobile drawer/hamburger.
- **Overlays (to add, §9/§10):** `ConfirmDialog` (danger zone disconnect/delete), `Toast` (save/disconnect/sync feedback). The prototype currently uses `alert()`/inline — replace with proper components (no visual redesign, just real feedback).

---

## 3. Component Planning

> Format: **Component — Purpose · Parent · Children · Props (shape, not code) · Local state · Global state · API deps · Reuse · Complexity (S/M/L)**

**Core / UI kit**
- **Button** — actions · any · icon slot · `{variant,size,leftIcon,loading,disabled,as(link/button)}` · none · none · none · ✅✅ · S
- **IconButton** — icon actions · Topbar/rows · — · `{icon,label(aria),onClick,as}` · none · none · none · ✅ · S
- **BrandMark** — logo · layouts · — · `{size}` · none · none · none · ✅ · S
- **Pill/Badge** — status/difficulty · tables/cards · — · `{tone,children}` · none · none · none · ✅✅ · S
- **PlatformBadge** — LC/CF/CC/HR glyph · many · — · `{platform,size}` · none · none · none · ✅✅ · S
- **Switch** — toggle · settings/profile · — · `{checked,onChange,label,disabled}` · none · none · none · ✅ · S
- **SegmentedControl** — choose one · analytics/settings · — · `{options,value,onChange}` · none · none · none · ✅ · S
- **Input/Select/Textarea/FormField/Label** — form fields · forms · — · `{name,value,error,...}` · none · (RHF) · none · ✅✅ · S
- **CopyButton** — copy link · profile · — · `{text,labels}` · `copied` · none · none · ✅ · S

**Data viz (client islands, lazy-loaded)**
- **StatCard / StatsGrid** — metric tile · pages · — · `{label,value,delta,icon,tone}` · optional count-up · none · (data via parent) · ✅✅ · S
- **DifficultyRing** — donut · panels · — · `{easy,medium,hard}` · none · none · parent · ✅ · M
- **ContributionHeatmap** — activity grid · panels · — · `{data[]}` or seeded · none · none · parent · ✅ · M
- **PlatformBreakdown / PlatformBar** — bars · panels · — · `{rows:[{platform,count,pct}]}` · none · none · parent · ✅ · S
- **TopicChips / Chip** — tag counts · panels · — · `{topics:[{name,count}]}` · none · none · parent · ✅ · S
- **SkillBadge** — hex badge · panels · — · `{label,tier,stars,solved}` · none · none · parent · ✅ · S
- **DataTable / SubmissionsTable** — rows · panels · `Pill,PlatformBadge,Link` · `{columns,rows,onRowClick,pagination}` · sort/page · none · parent · ✅ · M (L if virtualized)

**Layout shells**
- **PublicLayout** — `Navbar,Footer` · root · pages · `{children}` · mobile-menu open · theme · none · ✅ · S
- **AuthLayout** — brand panel + slot · root · `{children}` · none · none · none · ✅ · S
- **AppLayout** — `Sidebar,Topbar,MobileDrawer` · root · pages · `{children,activeNav,title}` · drawer open · auth,ui · `me` (user) · ✅ · M
- **Sidebar / NavItem** — nav · AppLayout · `NavItem` · `{items,active}` · none · ui(drawer) · none · ✅ · S
- **Topbar** — header · AppLayout · `IconButton,Search` · `{title}` · search text · none · notifications count · ✅ · S
- **MobileDrawer** — off-canvas nav · AppLayout · `Sidebar` · `{open,onClose}` · none · ui · none · ✅ · S

**Feature components** (one line each)
- **ProfileHeader** (app/public variants), **RepoHeader**, **FileList/FileRow**, **CommitList**, **RepoMappingRow**, **ActivityLog/LogRow**, **ConnectionRow/StatusPill**, **HealthBanner**, **FAQ/FAQItem**, **CodeBlock**, **QuestionPanel**, **PlatformPickerCard/ConnectModeCard**, **ProfilePreviewCard**, plus Landing sections (**Hero, ProblemSection, SolutionSteps, DashboardPreview, GitHubSyncFlow, RepoTree, PublicProfileShowcase, HowItWorks, FounderStory, FinalCTA**). Complexity mostly S–M; CodeBlock/QuestionPanel and DataTable are the M/L ones.

**Overlays to introduce (non-visual)**
- **ConfirmDialog** — guard destructive actions · app · `Button` · `{title,body,confirmLabel,tone,onConfirm}` · open · ui · none · ✅ · S
- **Toast/Toaster** — transient feedback · root · — · `{message,tone}` · queue · ui · none · ✅ · S

---

## 4. Folder Structure (web-frontend)

```
web-frontend/
├── src/
│   ├── app/                      # App Router: routes, layouts, loading/error/not-found
│   │   ├── (marketing)/          # public shell group → layout.tsx (Navbar+Footer)
│   │   ├── (auth)/               # auth shell group → layout.tsx (split)
│   │   ├── (app)/                # app shell group → layout.tsx (Sidebar+Topbar) + middleware-guarded
│   │   └── u/[username]/         # public profile (SSR/ISR)
│   ├── components/
│   │   ├── ui/                   # design-system primitives (Button, Pill, Switch, Input…)
│   │   ├── layout/               # Sidebar, Topbar, Navbar, Footer, MobileDrawer, *Layout
│   │   ├── data-viz/             # StatCard, DifficultyRing, Heatmap, PlatformBreakdown, DataTable
│   │   └── overlays/             # Toast, ConfirmDialog, Modal
│   ├── features/                 # one folder per domain (UI + hooks + api + types co-located)
│   │   ├── auth/  dashboard/  analytics/  repositories/  public-profile/
│   │   ├── sync/  settings/  notifications/  connect/  problem/  marketing/
│   ├── hooks/                    # cross-feature hooks (useMediaQuery, useDisclosure, useCopy)
│   ├── context/                  # providers: AuthProvider, ThemeProvider, UIProvider
│   ├── store/                    # lightweight global UI store (if not using context only)
│   ├── services/                 # api-client (2 bases), endpoints, query keys, fetch wrappers
│   ├── lib/                      # query client, fetcher, formatters, classnames helper
│   ├── assets/                   # static images, icons sprite, og images
│   ├── styles/                   # globals.css, tailwind layers, design tokens
│   ├── constants/                # platforms metadata, nav config, route paths
│   ├── types/                    # shared DTO/types (mirrors backend contract)
│   ├── utils/                    # pure helpers (slugify, pad, ext map, dates)
│   └── config/                   # env, runtime config, feature flags
├── public/                       # favicon, fonts (if self-hosted), static
├── tailwind.config.ts            # design tokens (coral/gold/rose, paper, type scale)
└── next.config.mjs
```

**Why each folder**
- `app/` — routing/layouts/loading/error per the App Router; route groups = the 3 shells.
- `components/ui` — stable design system; the one place style lives → consistency.
- `components/layout|data-viz|overlays` — shared structural/visual/feedback pieces.
- `features/*` — **domain ownership boundary** (UI + `hooks` + `api` + `types` together) → parallel dev, low conflict.
- `hooks/context/store` — reactive logic vs providers vs global UI state.
- `services` — single source for backend calls (two bases) + query keys → no scattered fetches.
- `lib/utils/constants/types/config` — pure infra; dependency-light, widely imported.
- `styles` + `tailwind.config` — **design tokens** = the locked theme; nothing hardcodes colors.

---

## 5. Routing Plan

| Path | Type | Auth | Notes |
|------|------|------|-------|
| `/` | public, static | — | Landing |
| `/login` | public | redirect if authed | Auth shell |
| `/u/[username]` | public, dynamic, SSR/ISR | — | Public profile; `notFound()` if unknown |
| `/privacy` `/terms` `/contact` | public, static | — | Legal/contact |
| `/app` (overview) | protected | required | App shell home |
| `/app/analytics` | protected nested | required | |
| `/app/repositories` | protected nested | required | |
| `/p/[platform]/[number]` | protected (or public SSR) dynamic | required* | Problem detail; decide public-share later |
| `/app/profile` | protected | required | Manage public profile |
| `/app/sync` | protected | required | |
| `/app/settings` (+ `#account/#github/...`) | protected | required | Hash sub-nav (scroll-spy) |
| `/app/notifications` | protected | required | |
| `/app/connect` | protected | required | Flow |

**Cross-cutting routes**
- **Loading pages:** `loading.tsx` per route group → skeletons (§10).
- **Error pages:** `error.tsx` per group (recoverable) + root `global-error`.
- **Not found:** `not-found.tsx` (unknown username/problem, bad URL).
- **Auth redirects:** middleware → unauthenticated hitting `(app)` → `/login?next=…`; authed hitting `/login` → `/app`.

---

## 6. State Management Plan

| State kind | Where | Tool | Examples | Why |
|-----------|-------|------|----------|-----|
| **Local UI** | component | `useState` | accordion open, segmented index, search text | ephemeral, not shared |
| **Global UI** | provider/store | Context (or Zustand) | drawer open, toasts, confirm dialog, active modal | shared across tree, tiny |
| **Server data** | query cache | **React Query** | stats, connections, sync status, notifications, profile | caching, dedupe, refetch, retries, loading/error built-in |
| **Form** | form lib | **React Hook Form + Zod** | login, contact, settings, connect | validation, dirty/touched, perf |
| **Auth/session** | provider + cookie | Context + httpOnly cookie | `user`, `isAuthed` | needed app-wide; secure cookie |
| **Theme** | provider | Context + CSS vars | light (default); dark = future | design tokens already CSS vars |
| **Persisted prefs** | server + local mirror | React Query + localStorage | settings toggles, public-profile visibility | source of truth = backend |

**Rules**
- **Never** put server data in global state — it goes in React Query.
- Theme is light-only today; build the provider so dark is a future flip (tokens already centralized).
- Keep global UI state minimal (drawer/toasts/dialogs) to avoid re-render storms.

---

## 7. API Integration Plan

> Abstract two bases behind one client: `api.web` and `api.git`. Each call has typed input/output and a **query key**.

| Page | Consumes | Loading | Error | Empty | Retry/Cache |
|------|----------|---------|-------|-------|-------------|
| Overview | web: `me`, `stats`, `connections`; git: `sync status` | skeleton cards/table | inline retry banner | "Connect a platform" CTA | cache 5 min; retry transient |
| Analytics | web: `stats` (detailed) | skeleton charts | retry | "No data yet" | cache 5 min |
| Repositories | git: `repos`, `recent commits`; web: `connections` | skeleton list | retry | "No synced solutions yet" | cache; revalidate on focus |
| Problem detail | git/web: `problem(question+solution)` | skeleton panels | not-found / retry | n/a | SSR + cache |
| Manage profile | web: `profile settings`, `preview` | skeleton | retry | n/a | mutate→optimistic toggle |
| Sync status | git: `connections status`, `activity log` | skeleton table | retry | "Nothing synced yet" | poll/refetch; cache short |
| Settings | web: `me`, `connections`, `repos`, `prefs` | skeleton sections | per-section retry | n/a | mutate→toast |
| Notifications | web: `notifications` | skeleton rows | retry | "You're all caught up" | mark-read mutation |
| Connect | web: add connection; git: authorize/trigger | button spinner | inline field error | n/a | mutation |
| Public profile `/u/[username]` | web: `public/:username` | SSR (no spinner) / skeleton on client nav | `notFound()` | "Private/empty profile" | ISR revalidate |
| Login | web: oauth start; (email link) | button spinner | inline | n/a | — |
| Contact | (form submit) | button spinner | inline | success state | — |
| Landing/Legal | none (static) | — | — | — | — |

**Cross-cutting**
- **Loading:** route `loading.tsx` skeletons + per-island spinners.
- **Error:** typed error → friendly message + retry; 401 → redirect to login; expired sync session → "Reconnect" affordance.
- **Empty states:** every list/table has a designed empty message + primary action (preserve visual style).
- **Caching:** React Query `staleTime` per resource; invalidate on related mutations (e.g., connect → invalidate stats + connections).
- **Optimistic UI:** toggles (visibility, sync prefs), mark-as-read.

---

## 8. Responsive Design Plan

**Breakpoints** (align to Tailwind + prototype): `sm 640 · md 768 · lg 1024 · xl 1280 · 2xl 1536`; treat **<820px = mobile app drawer** (prototype's threshold), **≥1920 = ultra-wide** (cap content width).

| Page | Mobile | Tablet | Laptop/Desktop | Ultra-wide |
|------|--------|--------|----------------|-----------|
| App shell | sidebar → **drawer + hamburger**; topbar search hidden | drawer or compact sidebar | full 236px sidebar | center app, max width, generous gutters |
| Overview/Analytics | single-column stacked panels | 2-col grid | 3-col grid (as designed) | 3-col, capped width |
| Repositories | stacked (file list → commits) | 1–2 col | 2-col (1.2/.8) | capped |
| Settings | sub-nav becomes top chips; sections stack | 1-col | 188px sub-nav + content | capped |
| Sync/Notifications | table → card-ish rows; horizontal scroll guard | normal | normal | capped |
| Landing | hamburger menu; sections stack; preview scales | 1–2 col | full multi-col | center, max ~1080–1200 |
| Login | brand panel hidden → mobile brand header | split | split | split, centered |
| Public profile | stacked | 2-col | 2-col grid | centered, capped |
| Problem detail | question/solution stack | stack | 2-col side-by-side | capped |

**Components needing distinct layouts:** Sidebar↔Drawer, Topbar (search visibility), DataTable (scroll/stack), Settings sub-nav (side↔top), AuthLayout (panel hide), DifficultyRing/Heatmap (scale, keep aspect). Add a **max content width** wrapper for 2xl/ultra-wide so dashboards don't stretch.

---

## 9. User Experience Plan (no visual redesign)

> All preserve the design language; they add states/feedback the static prototype can't have.

- **Loading:** skeletons for every data panel/table (matches card shapes).
- **Empty states:** "No platforms connected", "Nothing synced yet", "You're all caught up", "No results" — with a primary CTA.
- **Error feedback:** replace silent failures with inline retry banners + field-level errors.
- **Action feedback:** replace `alert()` with **toasts** (save, disconnect, copy, sync started) and **ConfirmDialog** for destructive actions (disconnect, disconnect-all, delete account) — currently they fire with no guard.
- **Form validation:** inline, on-blur + on-submit (Zod), accessible error text tied via `aria-describedby`; the login email link and contact form need real validation.
- **Navigation:** keep sidebar; add **active-route highlight from the URL** (prototype toggles via JS), breadcrumb on Problem detail (already), and persist drawer scroll.
- **Keyboard:** focus-visible already present; add **focus trap + ESC** for drawer/dialogs, roving focus for SegmentedControl, arrow-key + Enter/Space for FAQ accordion and sidebar.
- **Screen readers:** `aria-current="page"` on active nav, `aria-live="polite"` for sync status + toasts, label all icon buttons (present), `role`/labels on ring/heatmap (present), table `<caption>`/scope (present).
- **Reduced motion:** honor `prefers-reduced-motion` for count-ups, drawer, accordion, skeleton shimmer.
- **Sync expiry UX:** make the "Reconnect" path one click from the banner (already designed) + `aria-live` announce.
- **Codeforces badge color** stays its brand blue (intentional); document so it isn't "fixed" by mistake.

---

## 10. Animation Plan (minimal, professional)

| Where | Animation | Notes |
|------|-----------|-------|
| Page transitions | subtle fade/slide (8–12px), ≤200ms | App Router transitions; skip on reduced-motion |
| Hover | color/elevation on buttons, cards, rows | already in design; keep |
| Loading | **skeleton shimmer** + button spinners | per panel/table |
| Drawer | slide-in + scrim fade, ~220ms | already prototyped |
| Accordion (FAQ, settings) | height ease, ~250ms | already prototyped |
| Modal/Dialog/Toast | fade+scale in, slide for toast | new overlays |
| Count-ups (stats) | one-shot on first view | already; reduced-motion → static |
| Heatmap | render once (no per-cell anim) | deterministic, no churn |
| Success/Error | toast tone + small check/✗ | no confetti; professional |
| Scroll | reveal-on-scroll for landing sections only | marketing only, off elsewhere |

**Rule:** durations 150–250ms, ease-out; never block interaction; all gated by reduced-motion.

---

## 11. Performance Plan

- **RSC-first:** ship marketing/legal/shells as Server Components → minimal client JS.
- **Code splitting:** route-level by default; **dynamic import** heavy islands — `ContributionHeatmap`, `DifficultyRing`, charts, `CodeBlock` (and any syntax highlighter), `DataTable`.
- **Lazy loading:** below-the-fold landing sections; offscreen panels.
- **Fonts:** `next/font` (Inter + JetBrains Mono), subset, `display:swap`, preconnect — avoid layout shift.
- **Images/OG:** `next/image`; generate OG images for landing + public profile.
- **Memoization:** memo presentational lists/cells; `useMemo` for derived aggregates; stable keys.
- **Virtualization:** if the repositories file list / problems list grows large (>~100 rows), virtualize the table.
- **Bundle:** tree-shake icons (single SVG sprite already), avoid heavy chart libs (the prototype proves CSS/SVG suffices), analyze bundle in CI.
- **Caching:** React Query stale times + ISR for public pages; HTTP caching headers for static.
- **Avoid hydration cost:** keep client islands small; pass server-fetched data as props.

---

## 12. Feature Breakdown (modules)

Legend — **Pri:** P0/P1/P2 · **Cx:** S/M/L.

| Module | Purpose | Components | Backend APIs | Pri | Cx | Depends on |
|--------|---------|-----------|--------------|-----|----|-----------|
| **Design system / UI kit** | shared primitives + tokens | Button, Pill, Switch, Input, Select, SegmentedControl, Badge, CopyButton, Toast, ConfirmDialog | none | P0 | M | — |
| **Layout/shells** | 3 layouts + nav | PublicLayout, AuthLayout, AppLayout, Sidebar, Topbar, Navbar, Footer, MobileDrawer | `me` | P0 | M | UI kit |
| **Auth** | sign-in + session | Login form, GitHub button, AuthProvider, guards | web: oauth, me, logout | P0 | M | layouts |
| **Dashboard (overview)** | unified analytics home | ProfileHeader, StatsGrid, DifficultyRing, Heatmap, PlatformBreakdown, TopicChips, SkillBadge, SubmissionsTable | web: stats, connections; git: sync status | P0 | L | auth, data-viz |
| **Analytics** | deep stats | charts, bars, ring, SegmentedControl | web: stats(detailed) | P1 | M | dashboard parts |
| **Repositories** | synced repos | RepoHeader, FileList, CommitList, RepoMappingRow | git: repos/commits; web: connections | P1 | M | auth |
| **Problem detail** | question+solution | QuestionPanel, CodeBlock | git/web: problem | P1 | M | repositories |
| **Public profile (manage)** | configure share | Switch list, ProfilePreviewCard, CopyButton | web: profile prefs | P1 | S | dashboard parts |
| **Public profile (view)** | visitor page | ProfileHeader(public), stats, ring, heatmap | web: public/:username | P1 | M | data-viz |
| **Sync status** | health + log | HealthBanner, ConnectionRow, ActivityLog, table | git: status/log | P1 | M | auth |
| **Settings** | account+prefs | FormFields, Switch, Select, SegmentedControl, ConnectionRow, ConfirmDialog | web: me/connections/repos/prefs | P1 | L | UI kit, auth |
| **Notifications** | alerts | ActivityLog/notification rows | web: notifications | P2 | S | layouts |
| **Connect flow** | add platform | PlatformPickerCard, ConnectModeCard, Input | web: add connection; git: authorize | P0 | M | auth |
| **Marketing** | landing+legal+contact | all landing sections, FAQ, Footer, Contact form | none | P0 | M | UI kit |

---

## 13. Development Roadmap

**Phase 1 — Project setup & tokens**
Next.js + TS + Tailwind; design tokens (coral/gold/rose, paper, type scale); fonts; lint/format/CI; api-client skeleton (2 bases) + React Query provider.
*Why first:* tokens + tooling underpin every component; lock the theme once.

**Phase 2 — Design system (UI kit)**
Button, IconButton, Pill/Badge, PlatformBadge, Switch, SegmentedControl, form fields, CopyButton, Toast, ConfirmDialog, BrandMark.
*Why:* every page composes these; building features first would duplicate styles.

**Phase 3 — Layout shells & routing**
PublicLayout, AuthLayout, AppLayout (Sidebar/Topbar/Drawer), route groups, middleware guard, loading/error/not-found.
*Why:* pages need a shell + routing before content; mirrors the 3 prototype layouts.

**Phase 4 — Marketing**
Landing (all sections), Privacy, Terms, Contact. Static, no backend.
*Why:* unblocks public launch + lets the FE dev ship visibly while auth/backend lands; zero API dependency.

**Phase 5 — Auth UI**
Login, GitHub flow, AuthProvider, protected redirects.
*Why:* gates all app pages; needed before dashboard data.

**Phase 6 — Dashboard (overview)**
Compose data-viz components with React Query; loading/empty/error states.
*Why:* the product's core; exercises most shared components and the API client.

**Phase 7 — Connect flow + Settings**
Add/authorize platforms; settings sections; ConfirmDialog/toasts.
*Why:* dashboard needs connected platforms; settings manages them.

**Phase 8 — Analytics, Repositories, Problem detail**
Build on dashboard components + tables + code block.
*Why:* reuse Phase 6 widgets; depend on sync/repo data.

**Phase 9 — Sync status, Public profile (view + manage), Notifications**
*Why:* depend on git-service sync data + reuse profile/data-viz.

**Phase 10 — Hardening & production**
A11y pass, responsive QA, perf audits, skeletons everywhere, error boundaries, OG images, deploy.
*Why:* polish a feature-complete app, not a moving target.

---

## 14. Backend Integration Checklist (per page)

| Page | Required APIs | Data | Loading | Error | Success | Empty | Auth |
|------|---------------|------|---------|-------|---------|-------|------|
| Landing | — | static | — | — | — | — | public |
| Login | oauth start | — | spinner | inline | redirect /app | — | public |
| Overview | me, stats, connections, sync status | unified stats | skeletons | retry banner | render | connect CTA | required |
| Analytics | stats(detailed) | charts data | skeletons | retry | render | "no data" | required |
| Repositories | repos, commits, connections | repo + files | skeletons | retry | render | "nothing synced" | required |
| Problem detail | problem(question+solution) | one problem | SSR/skeleton | notFound | render | — | required* |
| Manage profile | profile prefs, preview | toggles | skeleton | retry | toast | — | required |
| Public profile | public/:username | aggregated | SSR | notFound | render | "empty/private" | public |
| Sync status | sync status, activity log | conns + log | skeleton | retry | render | "nothing yet" | required |
| Settings | me, connections, repos, prefs | account+prefs | skeletons | per-section retry | toast | — | required |
| Notifications | notifications | list | skeleton | retry | render | "all caught up" | required |
| Connect | add connection, authorize | — | button spinner | field error | redirect | — | required |
| Privacy/Terms/Contact | — / submit | static | — | inline | success state | — | public |

*Decide if Problem detail is shareable-public later.

---

## 15. Git Collaboration Strategy (FE + BE in parallel)

- **Branches:** trunk-based, short-lived: `feat/fe-dashboard`, `feat/fe-settings`, `fix/fe-drawer-focus`. Protect `main` (PR + review + CI).
- **Folder ownership:** FE owns `web-frontend/`, `frontendHtml/`; BE owns `web-backend/`, `git-service/`. **Almost zero overlap** → conflicts rare.
- **Component ownership:** one feature folder per task; the `components/ui` kit changes go through small, reviewed PRs (shared surface = review carefully).
- **Contract-first:** code against `docs/API_CONTRACT.md` (or OpenAPI) + typed DTOs in `types/`; FE uses **MSW/mocks** until endpoints land, then swaps.
- **Merge strategy:** squash-merge small PRs; rebase on `main` before opening; feature-flag incomplete UI.
- **PR workflow:** small PRs (<~400 lines), screenshots/Storybook for UI, checklist (responsive + a11y + states).
- **Naming:** Conventional Commits with `fe-*` scope: `feat(fe-overview): wire stats query`. **Author = you only, no co-author trailer.**
- **Minimize conflicts:** feature folders + UI-kit-as-stable-core + shared types in one place + frequent small merges.

---

## 16. Quality Assurance Plan

- **UI/unit:** component tests (React Testing Library) for UI kit + critical features; **Storybook** for the design system as living documentation.
- **Integration:** key flows with mocked APIs (login→dashboard, connect, settings save).
- **E2E:** Playwright happy paths (sign-in, navigate all pages, connect platform, copy profile link).
- **Responsiveness:** test the breakpoint matrix (§8) on real devices + emulators; drawer/table/sub-nav transitions.
- **Accessibility:** axe/Lighthouse a11y; manual keyboard pass (drawer, dialogs, accordion, segmented, tables); screen-reader smoke test; contrast already AA.
- **Browser compat:** latest Chrome/Safari/Firefox/Edge; iOS Safari + Android Chrome.
- **Performance:** Lighthouse/Web Vitals budgets (LCP, CLS, TBT); bundle-size check in CI; verify code-split islands.
- **UAT:** stakeholder click-through of every page against the prototype as the acceptance reference.

---

## 17. Milestones

| Milestone | Goal | Components to complete | Outcome | Dependencies | Definition of done |
|----------|------|------------------------|---------|--------------|--------------------|
| **F1 Setup** | Tooling + tokens | tokens, fonts, api-client, query provider | app boots, theme tokens live | — | CI green; sample token page renders |
| **F2 UI kit** | Design system | Button…ConfirmDialog, Toast | Storybook of primitives | F1 | all primitives documented + tested |
| **F3 Shells** | Layouts + routing | 3 layouts, Sidebar/Topbar/Drawer, guards | navigable empty shells | F2 | routes render; drawer + guard work |
| **F4 Marketing** | Public site | landing sections, legal, contact | landing live | F2–F3 | matches prototype; responsive; a11y pass |
| **F5 Auth** | Sign-in | Login, AuthProvider | login→/app works | F3 | protected redirect verified |
| **F6 Dashboard** | Core value | data-viz set + overview | live dashboard | F5 + stats API | states (load/empty/error) all handled |
| **F7 Connect+Settings** | Manage account | connect flow, settings, dialogs | users manage platforms | F6 | save→toast; disconnect→confirm |
| **F8 Analytics/Repos/Problem** | Depth | charts, tables, code block | full data pages | F6 | reuse widgets; virtualize if needed |
| **F9 Sync/Profile/Notifications** | Complete surface | sync, public profile, notifications | every page live | F7–F8 + git APIs | all 15 pages match prototype |
| **F10 Production** | Ship | skeletons, error boundaries, OG, perf | deployed | F1–F9 | QA + perf + a11y budgets met |

---

## 18. Final Frontend Blueprint

### 18.1 Component hierarchy tree
```
RootLayout (Providers: Auth, Theme, Query, UI/Toaster)
├── PublicLayout
│   ├── Navbar (BrandMark, nav, Button)
│   ├── <page>
│   │   ├── Landing: Hero·PlatformStrip·ProblemSection·SolutionSteps·
│   │   │            DashboardPreview·GitHubSyncFlow·RepoTree·
│   │   │            PublicProfileShowcase·HowItWorks·FounderStory·FAQ·FinalCTA
│   │   ├── PublicProfile: ProfileHeader·StatsGrid·DifficultyRing·
│   │   │                  PlatformBreakdown·Heatmap·TopicChips·CopyButton
│   │   ├── Privacy/Terms (prose)·Contact (Form)
│   └── Footer
├── AuthLayout → BrandPanel + Login(Form, GitHubButton)
└── AppLayout (Sidebar, Topbar, MobileDrawer)
    ├── Overview: ProfileHeader·StatsGrid·DifficultyRing·Heatmap·
    │             PlatformBreakdown·TopicChips·SkillBadge·SubmissionsTable
    ├── Analytics: SegmentedControl·StatsGrid·Bars·DifficultyRing·Sparkline
    ├── Repositories: RepoHeader·FileList·CommitList·RepoMappingRow → ProblemDetail(QuestionPanel·CodeBlock)
    ├── ManageProfile: Switch[]·ProfilePreviewCard·CopyButton
    ├── SyncStatus: HealthBanner·ConnectionRow[]·ActivityLog
    ├── Settings: SettingsSubnav·FormField[]·Switch[]·SegmentedControl·ConfirmDialog
    ├── Notifications: ActivityLog/notification rows
    └── Connect: PlatformPickerCard[]·Input·ConnectModeCard[]
shared: Button·IconButton·Pill·PlatformBadge·DataTable·Toast·ConfirmDialog (everywhere)
```

### 18.2 Page hierarchy
```
(marketing) /  /u/[username]  /privacy  /terms  /contact
(auth)      /login
(app)       /app  /app/analytics  /app/repositories  /p/[platform]/[number]
            /app/profile  /app/sync  /app/settings  /app/notifications  /app/connect
```

### 18.3 Development dependency graph
```
tokens+tooling ─▶ UI kit ─▶ layouts/routing ─┬─▶ marketing (no API)
                                              └─▶ auth ─▶ dashboard ─┬─▶ connect ─▶ settings
                                                                     ├─▶ analytics
                                                                     ├─▶ repositories ─▶ problem detail
                                                                     ├─▶ sync status
                                                                     ├─▶ public profile (view+manage)
                                                                     └─▶ notifications ─▶ production
```

### 18.4 Roadmap (one line)
`Setup → UI kit → Shells/Routing → Marketing → Auth → Dashboard → Connect+Settings → Analytics/Repos/Problem → Sync/Profile/Notifications → Hardening/Deploy`

### 18.5 Risk assessment
| Risk | Type | Mitigation |
|------|------|-----------|
| UI-kit churn breaks features | Maintainability | Lock kit early (F2); version + review kit PRs; Storybook contracts |
| FE/BE contract drift | Collaboration | Contract-first + typed DTOs + MSW mocks; PR-gated changes |
| Heavy charts bloat bundle | Performance | CSS/SVG (proven in prototype); dynamic-import islands; bundle budget |
| Hardcoded colors creep in | Consistency | Tokens-only rule; lint against raw hex; design tokens in Tailwind |
| Missing states (load/empty/error) | UX | States are first-class in every feature's DoD (§14) |
| Drawer/dialog focus traps wrong | A11y | Use vetted patterns; a11y in DoD; axe + keyboard QA |
| Public profile SEO/SSR mismatch | Rendering | SSR/ISR for `/u/[username]`; verify metadata + OG |
| Two API bases confuse callers | Architecture | Single client with `api.web`/`api.git`; query keys namespaced |

### 18.6 Final execution checklist
- [ ] Design tokens = single source of truth; no raw hex in components
- [ ] UI kit complete + Storybook before features
- [ ] 3 layouts + route groups + middleware guard
- [ ] Every data page has loading + empty + error + success states
- [x] Toasts + ConfirmDialog replace all `alert()`/silent actions
- [ ] React Query for all server data; RHF+Zod for all forms
- [ ] Responsive matrix verified (mobile→ultra-wide); drawer/table/sub-nav transitions
- [ ] A11y: keyboard, focus traps, aria-live, aria-current, contrast AA
- [x] Reduced-motion honored
- [x] Public profile SSR/ISR + OG/metadata
- [ ] Code-split heavy islands; fonts via next/font; images via next/image
- [ ] Contract-first DTOs + MSW mocks for parallel dev
- [ ] Conventional commits, `fe-*` scope, no co-author, small PRs
- [ ] Lighthouse perf + a11y budgets pass in CI *(automated in .github/workflows/a11y-perf.yml; must hit budgets)*
- [ ] Every page matches the approved `frontendHtml/` prototype (UAT sign-off)

> Next step when ready: I can expand any milestone into a component-by-component task checklist, or draft the **API contract / typed DTOs** doc that FE and BE build against — still no code.


---

## ✅ Completion checklist

> Area status at a glance. Full per-feature done / partial / pending tracking lives in **[PROGRESS.md](PROGRESS.md)**.

- [x] Designed & documented (this file)
- [x] Implemented in code — see [PROGRESS.md](PROGRESS.md) for this area's exact status
- [x] Tested / verified
- [ ] Production-hardened (pre-launch items tracked in [`../CERTIFICATES_BEFORE_LAUNCH/`](../CERTIFICATES_BEFORE_LAUNCH/))
