# 🧠 CodeVault — Skill Engine & Rival Mode: Implementation Roadmap

> Phased plan to build the patent-track features: **Unified Cross-Platform Proficiency
> Rating (Idea 1)**, **Adaptive DSA Roadmap (Idea 2)**, **Puzzle / Boss-Battle game
> (Idea 5)**, and **Rival Mode**. Each phase is shippable on its own and builds on the
> previous one. Reuses existing services — no rewrite.
>
> Design details: see [PATENT_SPEC — Skill Engine](#) (Idea 1/2/5 spec).

---

## Dependency map
```
Phase 0 (data)  →  Phase 1 (UCPR)  →  Phase 2 (concept graph)  →  Phase 3 (roadmap)
                        │                                              │
                        └────────────→  Phase 4 (game)  ──────────────┘
                                             │
                                             └──→  Phase 5 (Rival/PvP)  →  Phase 6 (badges/leaderboards)
                                                                              │
                                                                              └──→  Phase 7 (ML calibration)
```

---

## Phase 0 — Data foundation (normalized item bank)
**Goal:** one comparable difficulty scale + a clean per-user solved-item store.
- Add a **difficulty calibration table** `D()` mapping each platform's native difficulty
  (LeetCode Easy/Med/Hard, CF rating, CodeChef stars, HackerRank tiers) onto a common
  Codeforces-anchored scale (≈800–3500). Seed with fixed values.
- Persist per solved problem: `platform, slug, tags[], b_i (cf-equivalent), solvedAt, language`
  (extend the existing `Problem` / stats data; reuse the scrapers' output).
- **Reuse:** existing platform scrapers, `stats.service` snapshot cache.
- **Deliverable:** `skill/calibration.ts` + a normalized `getUserItems(userId)` helper.
- **Tests:** calibration mapping, item normalization.

## Phase 1 — Unified Cross-Platform Proficiency Rating (Idea 1) 🟢
**Goal:** one calibrated skill number + per-topic sub-scores.
- `web-backend/src/services/skill.service.ts`: weighted IRT (Rasch) estimate of latent skill
  θ over the item bank, with **recency decay** and **contest-rating anchoring**; per-topic θ.
- Endpoint `GET /api/skill` → `{ ucpr, perTopic, confidence }`; cache in Redis (like stats).
- **Frontend:** UCPR card on the dashboard + per-topic radar/bars (reuse `.stat`/`.ring`).
- **User controls:** platform weights, target rating (Settings).
- **Tests:** monotonicity (more/harder solves ⇒ higher θ), recency effect, topic decomposition.

## Phase 2 — Concept graph + skill-gap analysis (Idea 2, part 1) 🟢
**Goal:** know what the user is missing and in what order.
- Curated **DSA concept graph** (topics + prerequisite edges) as static JSON.
- Mastery per node from θ_topic + count + recency; **gap = target − mastery** with
  prerequisite gating (don't surface advanced topics before prereqs are ready).
- **Goal templates**: FAANG interview / ICPC / "master graphs" (target mastery per topic).
- **Deliverable:** `skill/conceptGraph.ts`, gap computation in `roadmap.service.ts`.
- **Tests:** prerequisite gating, gap ranking, goal-template application.

## Phase 3 — Adaptive roadmap / next-problem recommender (Idea 2, part 2) 🟢🔴
**Goal:** recommend the single next problem from *any* platform that best fills the gap.
- Item selection = `argmax [ItemInfo(θ_topic, b_i) · topicPriority · novelty(i)]`, difficulty
  targeted at the flow zone (~55–65% predicted success).
- **Novelty filter** uses submitted-code similarity — call a hook in **git-service** (which
  already holds the code) so code never leaves that service.
- Endpoints `GET /api/roadmap`, `POST /api/roadmap/feedback` (online re-rank after each outcome).
- **Frontend:** Roadmap page (reuse panels/lists); mark-known, reorder, pick goal.
- 🔴 Needs a candidate problem pool per platform (crawl/seed problem metadata).
- **Tests:** flow-zone difficulty selection, novelty penalty, re-rank on feedback.

## Phase 4 — Puzzle / Boss-Battle game (Idea 5, single-player) 🟢
**Goal:** a gamified daily mode driven by the user's real data.
- `game.service.ts`: procedural **boss battle** = target weakest eligible topic, difficulty at
  θ_topic + δ; **entropy-weighted XP** (weak/rare topics pay more than grinding strong ones);
  streaks; **deterministic daily** challenge from `hash(date, userId)`.
- Endpoints `GET /api/game/daily`, `POST /api/game/complete`.
- **Frontend:** Arena page; XP/streak widgets (reuse badges/heatmap styles).
- **User controls:** difficulty bias, favorite/blocked topics.
- **Tests:** deterministic seed, XP weighting, difficulty calibration.

## Phase 5 — Rival Mode + PvP duel (Idea 5 PvP + Rival Mode) 🟢
**Goal:** friendly rivalry on top of the existing social graph.
- **Reuse:** `follow.service` (who you follow) + `message.service` (challenge invites).
- Rivalry view: **compare topic strengths** between two users (their per-topic θ side by side),
  weekly duel, **same-problem challenge** (both get the same calibrated problem, first correct wins).
- **Matchmaking** by UCPR proximity; ELO-style update on the game rating.
- Prompts like *"Your friend solved 6 graph problems this week, you solved 0 — challenge them in
  Graph Arena?"* generated from the per-topic diff.
- Endpoints `POST /api/rival/challenge`, `GET /api/rival/:handle/compare`.
- **Frontend:** rival comparison card + "Arena" duel; invites flow through Messages.
- **Tests:** matchmaking proximity, duel resolution, ELO update.

## Phase 6 — Public badges + leaderboards 🟢
**Goal:** make wins and rank visible (drives engagement + verification value).
- **Winner public badge** on the public profile (`/u/[username]`); duel history.
- **Leaderboards** by UCPR: global / per-topic / friends-only.
- **Reuse:** public profile + follow graph.
- **Tests:** badge issuance, leaderboard ordering, privacy (public profile exposes no PII).

## Phase 7 — ML calibration & anti-abuse 🔴
**Goal:** make the numbers trustworthy and hard to game.
- **Learn** the difficulty calibration `D()` from users holding rated accounts on ≥2 platforms
  (replaces the seeded table with fitted values).
- Anti-abuse: rate-limit XP, detect farming/duplicate-solve gaming, sanity-check improbable jumps.
- Telemetry + A/B on recommendation quality.

---

## Reuse summary (what already exists)
| Existing | Used by |
|----------|---------|
| Platform scrapers + normalized tags/difficulty | Phase 0, 1 |
| `stats.service` Redis cache pattern | Phase 1 (cache UCPR) |
| Stored submission **code** in git-service | Phase 3 novelty filter |
| `follow.service` | Phase 5 rivalry |
| `message.service` | Phase 5 challenge invites |
| Public profile `/u/[username]` | Phase 6 badges/leaderboards |

## Suggested shipping order for maximum value
**Phase 0 → 1** first (UCPR is the visible hook and underpins everything), then **5 (Rival Mode)**
because it reuses follow+messages and is high-engagement with low new infra, then **2 → 3**
(roadmap), then **4 (game)** and **6 (badges)**. Phase 7 is ongoing.

*Last updated: 2026-07-22.*
