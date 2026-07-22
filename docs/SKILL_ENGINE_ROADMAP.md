# 🧠 CodeVault — Skill Engine, Rival Mode & Flash Arenas: Roadmap

> Plain-English build plan for the patent-track features. Every phase lists **What it is**,
> a **Real use case** (a concrete scenario), **Why it matters** (the purpose), and the
> **Tech we use / reuse** — so the whole team stays on the same page and nobody gets
> confused later.

---

## 0. Why any of this — the one-line pitch
CodeVault is the **only** product that has, for one person, their solved problems + topics +
difficulty + *actual code* across **LeetCode, Codeforces, CodeChef, HackerRank** in one place,
plus a GitHub trail and a browser extension. Everything below is only possible **because** we
already have that unified cross-platform data. That's our moat — and the source of the patents.

---

## Phase 0 — Data Foundation ⭐ (start here; the team asked about this one)

**What it is (plain English):** Every platform describes difficulty differently — LeetCode says
"Easy/Medium/Hard", Codeforces says "1500", CodeChef says "3 stars", HackerRank says "Gold badge".
Phase 0 converts *all of them* into **one common number** and stores every solved problem in a
clean, uniform list. Think of it as building the "dictionary" that lets us compare apples to apples.

**Real use case:** A user solved a LeetCode Medium, a Codeforces 1600, and a CodeChef 3-star.
Right now those are three unrelated things. After Phase 0 they all become, say, ~1500 on **one
scale** — so we can finally say "this person operates around the 1500 level overall."

**Why it matters (purpose):** *Nothing else works without this.* The rating (Phase 1), the roadmap
(Phase 3), the game (Phase 4), and Flash Arenas all read from this one normalized list. Get this
right once → everything above it becomes easy.

**Tech we use / reuse:**
- **Reuse:** the existing platform scrapers (they already return tags + difficulty), the `Problem`
  table, and the `stats.service` Redis cache pattern.
- **New:** a small `skill/calibration.ts` — a **calibration table** `D()` mapping each platform's
  native difficulty → a **Codeforces-anchored 800–3500 scale** (we pick CF as the anchor because
  it already gives an exact per-problem number). Plus a `getUserItems(userId)` helper that returns
  `{ platform, slug, tags[], difficulty, solvedAt, language }` for every solve.
- **Stack:** TypeScript, Prisma/Postgres, Redis. No new services.

---

## Phase 1 — Unified Cross-Platform Rating (UCPR) — *the visible hook*

**What it is:** One single skill number (like an ELO) + a per-topic breakdown, computed from the
Phase 0 data.

**Real use case:** A user's dashboard shows **"UCPR 1720"** and a radar: strong in DP (1900),
weak in Graphs (900). Recruiters and rivals instantly understand one number.

**Why it matters:** Today there is **no** cross-platform comparable number — people argue "is CF
1500 = LeetCode Knight?". We *define* it. It powers leaderboards, matchmaking, roadmaps, and games.

**Tech:** `web-backend/src/services/skill.service.ts` — a weighted **Item-Response-Theory (IRT)**
estimate with recency decay + contest-rating anchoring. Endpoint `GET /api/skill`, cached in Redis.
Frontend: a dashboard card + radar (reuse existing `.stat` / `.ring` styles).

---

## Phase 2 — Concept Graph + Gap Analysis ⭐ (the other one the team asked about)

**What it is (plain English):** A **map of DSA topics with arrows showing what you must learn
first** (arrays → two-pointers → sliding-window; BFS/DFS → shortest-paths → MST…). We compare the
user's per-topic scores (from Phase 1) against this map to find **exactly what they're missing and
in what order**.

**Real use case:** The system sees "you're great at DP but have **never** touched graphs on *any*
platform, and you haven't done recursion basics" → it knows not to throw you an advanced graph
problem yet; first it fills recursion → BFS → then shortest paths.

**Why it matters:** This is what makes the roadmap (Phase 3) *smart* instead of a random list.
Existing roadmaps (NeetCode, Striver) are the **same static list for everyone**. Ours is built
from **your real cross-platform history**, so it never wastes your time on what you already know.

**Tech we use / reuse:**
- **New:** `skill/conceptGraph.ts` — a **curated static JSON** of topics + prerequisite edges
  (we hand-write this once), plus **goal templates** (FAANG interview / ICPC / "master graphs")
  that say which topics and what level you need.
- **Reuse:** the per-topic scores from Phase 1.
- **Stack:** TypeScript, a JSON graph, simple graph traversal. No ML yet.

---

## Phase 3 — Adaptive Roadmap (next-problem recommender)

**What it is:** Given your gaps + a goal, it recommends the **single best next problem — from
whichever platform fits best** — at a difficulty right at your edge (~55–65% chance you solve it).

**Real use case:** You pick goal = "FAANG interview." It says: *"Next: solve this Codeforces 1400
BFS problem"* — even though you usually live on LeetCode — because that's the fastest way to close
your graph gap.

**Why it matters:** Turns "what should I practice?" (the #1 question every coder asks) into a
one-click answer, personalized and cross-platform.

**Tech:** `roadmap.service.ts` — picks the problem that maximizes learning (IRT information-gain) +
respects prerequisites + a **code-similarity "novelty" filter that runs *inside* git-service** (so
your submitted code never leaves that service). Endpoints `GET /api/roadmap`, `POST /api/roadmap/feedback`.

---

## Phase 4 — Boss-Battle Game (solo)

**What it is:** A daily gamified challenge generated *from your own data* — a "boss" is a topic
you're weak in, at a difficulty at your edge. XP is **entropy-weighted**: solving a weak/rare topic
pays far more than grinding a topic you've already mastered.

**Real use case:** Daily "Graph Gauntlet" appears because graphs are your weakest area; a streak and
XP bar make you come back every day.

**Why it matters:** Habit + retention. Difficulty and targeting are *calibrated* (by Phase 1 & 2),
not random — that's the patentable bit.

**Tech:** `game.service.ts`, deterministic daily seed `hash(date, userId)`, endpoints
`GET /api/game/daily`, `POST /api/game/complete`. Frontend Arena page.

---

## Phase 5 — Rival Mode + PvP (uses your existing follow + messages)

**What it is:** Friendly 1-v-1 rivalry — compare two users' topic strengths, weekly duels,
same-problem challenges, winner gets a public badge; challenge invites go through Messages.

**Real use case:** *"Your friend solved 6 graph problems this week, you solved 0 — challenge them
in Graph Arena?"* You tap it, both get the same calibrated problem, first correct wins.

**Why it matters:** Highest engagement for the **least new infrastructure** — you already have the
**follow** and **message** systems. Matchmaking uses the UCPR from Phase 1.

**Tech:** reuse `follow.service` + `message.service`; new `rival` endpoints; ELO update on the
game rating.

---

## Phase 5.5 — ⚡ CodeVault Flash Arenas (the addictive multiplayer flagship) ⭐ NEW

**What it is (plain English):** Real-time multiplayer DSA practice with your friends. You and up to
3 friends click **"Create Flash Arena."** CodeVault instantly cross-references **all of your
accounts across all platforms**, finds **2 problems that *none* of you have ever solved**, and
opens a private room. Everyone hits **Start**. When you open LeetCode/CodeChef to solve, the
**CodeVault browser extension injects a Live Multiplayer Scoreboard right onto the problem page** —
so while you type, you watch a friend's progress bar move as they pass test cases.

**Real use case:** 4 friends from a college WhatsApp group have 15 free minutes. Instead of a lonely
2-hour weekend contest, they spin up a Flash Arena and race on 2 fresh problems live — like a mini
esports match for DSA. Whoever finishes first wins; everyone sees the live scoreboard.

**Why it matters (purpose):**
- Solo practice is **lonely and boring**; official contests are long, weekend-only, and intimidating.
  Flash Arenas turn practice into a **15-minute adrenaline game with real friends** → people come
  back daily and pull their friends in (viral growth).
- **Why patentable:** the method of **dynamically generating an "unseen" problem set by
  cross-referencing multiple users' cross-platform solved-histories** — only possible because we
  have everyone's unified data. Plus the **extension-injected live multiplayer scoreboard** on a
  third-party judge's page.
- **Business model:** sell **"CodeVault Arena"** to colleges / coding clubs (e.g. ASCEND) so they
  can host **automated, live-tracked micro-tournaments** for students.

**Tech we use / reuse:**
- **Reuse:** the existing **browser extension** (it already reads accepted submissions — extend it
  to read live "test cases passed" and render an overlay), the **Phase 0 item bank** (to know what
  each player has/hasn't solved), and **follow/messages** (invite friends into a room).
- **New:**
  1. **"Unseen problem" generator** — intersect the *solved sets* of all room members across all
     platforms, pick problems in nobody's set at a difficulty near the group's average UCPR.
  2. **Real-time layer** — a WebSocket (or SSE) channel so each player's progress broadcasts to the
     room live (Socket.IO / ws, backed by Redis pub/sub — you already run Redis).
  3. **Scoreboard overlay** — a content-script UI the extension injects into the LeetCode/CodeChef
     problem page, subscribed to the room's live channel.
  4. **Room service** — create/join/start/finish, results + winner badge.
- **Stack:** TypeScript, WebSockets (Socket.IO), Redis pub/sub, the MV3 extension, Postgres for
  rooms/results.

**Depends on:** Phase 0 (unified data) + the browser extension. Best built right after Phase 1
(so difficulty is calibrated) and alongside Phase 5.

---

## Phase 6 — Public Badges + Leaderboards
Winner badges on the public profile `/u/[username]`, UCPR leaderboards (global / per-topic /
friends). **Reuse** public profile + follow graph.

## Phase 7 — ML Calibration & Anti-Abuse
Learn the difficulty table `D()` from users with rated accounts on ≥2 platforms; prevent XP/score
farming and duplicate-solve gaming.

---

## Reuse summary (technologies already in the repo)
| Existing piece | Powers |
|----------------|--------|
| Platform scrapers (tags + difficulty) | Phase 0, 1 |
| `stats.service` Redis cache | Phase 1, Flash Arenas (pub/sub) |
| Submitted **code** in git-service | Phase 3 novelty filter |
| **Browser extension** (reads submissions) | ⚡ Flash Arenas live scoreboard |
| `follow.service` + `message.service` | Phase 5 + Arena invites |
| Public profile `/u/[username]` | Phase 6 badges/leaderboards |
| Redis | WebSocket pub/sub for real-time |

## Recommended build order
**0 → 1 → 5 → 5.5 (Flash Arenas) → 2 → 3 → 4 → 6**, with 7 ongoing.
Rationale: Phase 0 is the foundation everything needs; Phase 1 (UCPR) is the visible hook; then the
**multiplayer track (5 → Flash Arenas)** gives the biggest, most viral engagement for the least new
infrastructure because follow/messages/extension already exist.

*Last updated: 2026-07-22.*
