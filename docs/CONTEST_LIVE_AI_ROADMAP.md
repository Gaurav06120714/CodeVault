# 🏁 CodeContest Live + AI — Implementation Roadmap

> Plan for: **paste a problem link while creating a contest → CodeVault opens that problem
> in-app → friends solve it together with a live scoreboard and live chat → an AI assistant
> helps (hints during, full analysis after) → powered by our own LLM.**
>
> Every phase says **What it is**, **How it works** (the flow), **Tech**, and **What we reuse**
> so the whole team is clear. Honest "hard parts" + a recommended MVP order are at the end.

---

## The end-to-end flow (what we're building)
```
Create Contest ──paste problem URLs──▶ CodeVault fetches each problem
      │                                      │
      ▼                                      ▼
  invite friends ──▶ Live room ──▶ each friend sees the SAME problem IN CodeVault
                          │                 │  (statement + code editor)
                          ▼                 ▼
                 live scoreboard      submit code ──▶ verdict ──▶ score updates live
                          │
                          ▼
                    live chat  +  AI assistant (hints now / analysis after)
```

---

## Phase 1 — Paste-a-link problem ingestion (the entry point) ⭐
**What it is:** In "Create Contest," the user pastes a problem URL (LeetCode / Codeforces /
CodeChef / HackerRank / CodeVault). CodeVault turns that link into a real, stored contest problem.

**How it works:**
1. User pastes e.g. `https://leetcode.com/problems/number-of-islands/`.
2. A **URL parser** detects the platform + the problem slug/id.
3. A **statement fetcher** pulls the problem: title, difficulty, tags, and the **full statement**
   (constraints, examples). We already scrape stats — this extends the scrapers to fetch the
   *statement body*.
4. The problem is sanitized (HTML → safe render) and saved to the contest.

**Tech:** URL parser (regex per platform), per-platform statement fetchers (extend existing
`services/platforms/*`), HTML sanitization (DOMPurify), Prisma models `Contest` + `ContestProblem`.

**Reuse:** the existing platform scrapers + normalized tags/difficulty; the same 20-min cache pattern.

**⚠️ Note:** platform ToS — fetching full statements is heavier than stats. Cache aggressively,
respect rate limits, and show attribution/link back to the source.

---

## Phase 2 — In-app problem viewer + code editor
**What it is:** When the contest starts, each friend opens the problem **inside CodeVault** — the
statement on one side, a code editor on the other — instead of leaving to the original site.

**How it works:** The room loads the stored `ContestProblem`; the page renders the statement +
an embedded editor with a language dropdown. Users write and run their code without leaving.

**Tech:** **Monaco Editor** (the VS Code editor, in-browser) or CodeMirror 6; syntax highlighting +
language select; autosave draft to local/Redis.

**Reuse:** the CodeVault app shell, theme, and (later) git-service to store/publish solutions.

---

## Phase 3 — Code execution / judging (the hard part) 🔴
**What it is:** Running the pasted problem's tests and giving a verdict (Accepted / Wrong / TLE)
so scores update — all inside CodeVault.

**Three realistic options (pick one to start):**
| Option | How | Pros | Cons |
|--------|-----|------|------|
| **A. Third-party judge** (Judge0 / Piston API) | Send code + our own test cases → get output | Fast to ship, many languages | We must supply/derive test cases; API limits/cost |
| **B. Own sandboxed runner** | Docker + `isolate`/nsjail on a worker | Full control, no per-call cost | Security-heavy (untrusted code!), infra + ops |
| **C. Submit-to-origin via extension** | Browser extension submits to the *real* platform and reads the verdict | Real judging, real test cases | Needs the extension + the user's platform login; per-platform |

**Recommendation:** start with **Option A (Judge0)** for CodeVault-native problems (we own the
tests), and use **Option C** for imported LeetCode/CF problems (real verdicts via the extension we
already have). Avoid Option B until scale demands it — running untrusted code safely is a project on
its own.

**Tech:** BullMQ job queue (already used in git-service) for submissions; Judge0 self-host or API;
verdict → score update published to the room.

---

## Phase 4 — Live contest rooms (real-time) ⭐
**What it is:** Everyone in the contest sees the same live state — who solved what, scores, ranks,
time remaining — updating instantly.

**How it works:** Each contest is a **room**. When someone submits/solves, the server broadcasts the
update to everyone in the room over a **WebSocket**, so scoreboards move in real time.

**Tech:** **Socket.IO** (or `ws`) on a small realtime service; **Redis pub/sub** (you already run
Redis) so it scales across instances; room state in Postgres.

**Reuse:** Redis; the CodeContest dashboard UI (leaderboard, progress bars) is already built.

---

## Phase 5 — Live chat in the contest ⭐
**What it is:** A chat panel inside the contest room so friends can discuss, react, and trash-talk
while they solve.

**How it works:** Same WebSocket room as the scoreboard — messages broadcast to all participants and
are persisted so late-joiners see history. Optional: per-problem threads, emoji reactions.

**Tech:** the Phase-4 Socket.IO + Redis channel; persist messages in Postgres.

**Reuse:** your existing **messages** system (`message.service`) for storage + the message UI style.

**⚠️ Contest-fairness note:** consider a "no full-solution sharing during a live contest" guard, or a
spoiler-blur, so chat helps discussion without letting people paste answers.

---

## Phase 6 — AI assistant: when & how it helps
**What it is:** An AI helper in the room — but it plays fair. Its behaviour depends on **timing**.

**How it works (the rules):**
- **During a live contest:** hints only — explain the problem, nudge the approach, point out a bug —
  **never the full solution.** Difficulty-tiered (beginner / intermediate / advanced), and
  **rate-limited** so it's a helper, not a cheat button. (The UI for this is already prototyped.)
- **After the contest:** full mode — complete solutions, complexity analysis, "why you got it wrong,"
  and better-approach suggestions per participant.

**Tech:** an `ai.service` that builds a prompt from the problem + the user's current code + a mode
flag (`live-hint` vs `post-analysis`), calls the LLM (Phase 7), and streams the answer into the chat.

**Reuse:** the CodeContest AI panel UI; the room WebSocket to stream tokens live.

---

## Phase 7 — Our own LLM (options, honest) 🔴
**What it is:** Instead of only calling a paid API, run/own the model that powers the assistant.

**Three paths (increasing effort):**
| Path | What | Effort | When |
|------|------|--------|------|
| **1. API first** (recommended start) | Call a hosted LLM behind our `ai.service` | Low | Ship the feature now; swap later |
| **2. Self-host open model** | Run **Qwen2.5-Coder / Llama / Mistral** via **Ollama** (dev) or **vLLM** (prod) on a GPU box | Medium | When you want no per-call cost / privacy |
| **3. Specialize it** | **RAG** over a DSA/problem corpus, or **LoRA fine-tune** on hint-style data, so it's great at hints (not solutions) | High | Once usage justifies it |

**Recommendation:** keep `ai.service` **provider-agnostic** (one interface, swappable backends) so
you can start on an API today and drop in your **self-hosted Qwen-Coder** later without touching the
product. Fine-tuning is a later optimization, not a blocker.

**Tech:** `ai.service` abstraction; Ollama/vLLM for self-host; a vector DB (pgvector — you already
run Postgres) for RAG; guardrails/prompt to enforce "hints not solutions" during live contests.

---

## Hardest parts (be realistic)
1. **Running untrusted code safely** (Phase 3) — the single biggest challenge. Start with Judge0 /
   the extension; don't build your own sandbox early.
2. **Fetching full problem statements** (Phase 1) — heavier scraping + ToS/copyright care.
3. **Self-hosting an LLM** (Phase 7) — needs a GPU and ops; start with an API.
4. **Real-time at scale** (Phase 4/5) — fine on Redis pub/sub, but needs an always-on socket service
   (not free-tier-sleep friendly).

## Recommended MVP order
**1 → 2 → 4 → 5 → 6 (live hints, API LLM) → 3 (Judge0 for CodeVault problems) → 7 (self-host)**

Reasoning: get **paste-link → view in app → live room → chat → AI hints** working end-to-end first
(that's the wow-factor demo), using an **API LLM** and **extension/Judge0** for verdicts. Own-LLM and
a custom sandbox come after the experience is proven.

*Last updated: 2026-07-23.*
