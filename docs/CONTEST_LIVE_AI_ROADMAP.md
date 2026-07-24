# 🏁 CodeContest Live + AI — Roadmap & Status

> Paste a problem link while creating a contest → CodeVault opens it **in-app only** → friends
> solve it there with a **live scoreboard + live chat** → an **AI assistant** helps (hints during,
> full analysis after) → **anti-cheat** keeps it fair → powered by **our own LLM**.
>
> Each phase: **What / How it works / Tech / Reuse**. Prototype status, an integrity/anti-cheat
> phase, the own-LLM prep, and a **checklist** are included so we can start implementing.

---

## ✅ Built in the prototype today (`frontendHtml/codecontest.html`)
Clickable, mock-data UI already exists for:
- **Create Contest** — paste a problem URL → auto-detects platform + problem name → adds it (4–6).
- **Live contest room** — problem tabs, **in-app problem statement + code editor** (write in CodeVault),
  Run/Submit with a mock verdict, pause/restart timer, live leaderboard.
- **Live chat** in the room.
- **AI hint** button in the room (hints only) + a full **AI Assistant** tab (beginner/intermediate/
  advanced, gated "reveal solution").
- **Anti-cheat (mock):** problems are **in-app only** (source link locked during the contest);
  the chat **blocks full-code messages**; **tab-switch detection** warns then **deducts score**.
- Compare-friend, post-contest analysis (chart + badges), history. Dark/light + responsive.

> This is frontend/mock only. The phases below turn it into a real product.

---

## The end-to-end flow
```
Create ─paste URLs→ fetch problem ─→ Live room (in-app viewer + editor)
                                        │           │
                                 live scoreboard   submit → judge → verdict → score
                                        │
                                 live chat  +  AI (hints now / analysis after)  +  anti-cheat
```

## Phase 1 — Paste-a-link problem ingestion ⭐
**What:** paste a problem URL in Create → real stored contest problem.
**How:** URL parser detects platform + slug → statement fetcher pulls title/difficulty/tags/**full
statement** → sanitize (DOMPurify) → save.
**Tech:** per-platform statement fetchers (extend `services/platforms/*`), Prisma `Contest`/`ContestProblem`.
**Reuse:** existing scrapers + cache. **⚠️** heavier scraping → cache hard, respect ToS, attribute source.

## Phase 2 — In-app problem viewer + code editor (in-app ONLY)
**What:** the problem opens **inside CodeVault** — statement + editor — and must **not** send the user
to LeetCode/CF/etc. during the contest.
**How:** room loads the stored `ContestProblem`; renders statement + **Monaco** editor + language select;
the source link is **disabled/hidden while the contest is live** (unlocks after).
**Tech:** Monaco (or CodeMirror 6); autosave draft to Redis.
**Reuse:** app shell + theme; git-service to store/publish solutions later.

## Phase 3 — Code execution / judging 🔴 (hard)
**What:** run tests, give a verdict so scores update.
**Options:** **A. Judge0/Piston API** (start here for CodeVault-owned problems) · **B. own Docker+isolate
sandbox** (powerful but security-heavy; avoid early) · **C. submit-to-origin via the browser extension**
(real verdicts for imported LeetCode/CF problems).
**Recommend:** Judge0 for native problems + extension for imported. **Tech:** BullMQ queue (already used).

## Phase 4 — Live rooms (real-time) ⭐
**What:** everyone sees the same live scoreboard/state instantly.
**Tech:** **Socket.IO** + **Redis pub/sub** (already run Redis); room state in Postgres.
**Reuse:** the leaderboard UI is built.

## Phase 5 — Live chat ⭐
**What:** discuss while solving.
**Tech:** same Socket.IO room + persistence. **Reuse:** the **messages** system (`message.service`).

## Phase 6 — AI assistant: when & how
**What:** an in-room helper that plays fair.
**Rules:** **during** a live contest → **hints only** (tiered, rate-limited, never full solutions);
**after** → full solutions, complexity, "why you got it wrong."
**Tech:** `ai.service` builds a prompt from problem + user code + a `mode` flag (`live-hint`/`post-analysis`),
calls the LLM (Phase 8), streams into chat.

## Phase 7 — 🛡️ Integrity & anti-cheat ⭐ NEW
**What:** keep the live round fair — the three rules you asked for.
**How it works:**
1. **In-app only** — problems render inside CodeVault; the source/original-site link is **locked during
   the contest** so nobody "opens it on LeetCode."
2. **Block shared solutions in chat** — before a chat message sends, the **AI/LLM classifies it**; if it's
   a **full code solution**, it's **not sent** ("Unable to send — full code is blocked during a live
   contest"). Hints/discussion pass through. (Prototype uses a heuristic; production uses the LLM.)
3. **Tab-switch / focus detection** — on `visibilitychange`/`blur` we count when the user leaves the
   contest tab: **1st = warning**, then each further switch **deducts score** and flags the participant.
   A **🛡️ Focus** indicator shows the count + penalty live.
**Tech:** Page Visibility API + blur/focus + optional paste/devtools signals (client); an **LLM/classifier
guard** server-side for chat + submissions (so it can't be bypassed by the client); penalties applied on the
server and broadcast to the room.
**⚠️ Honest limits:** browser anti-cheat is deterrence, not airtight (users can use another device). Combine
signals (focus + paste + submission diff + code-similarity) and keep the server as the source of truth.

## Phase 8 — 🤖 Our own LLM (prepare now) 🔴
**What:** own the model behind the assistant + the anti-cheat classifier.
**Three paths (increasing effort):**
| Path | What | Effort | When |
|------|------|--------|------|
| **1. API first** ✅ recommended start | Call a hosted LLM behind our `ai.service` | Low | Ship the feature now |
| **2. Self-host open model** | **Qwen2.5-Coder / Llama / Mistral** via **Ollama** (dev) → **vLLM** (prod) on a GPU | Medium | No per-call cost / privacy |
| **3. Specialize** | **RAG** over a DSA corpus (pgvector) + **LoRA fine-tune** on *hint-style* data | High | Once usage justifies |

**How to prepare now (so the swap is painless later):**
1. Build a **provider-agnostic `ai.service`** — one interface (`hint()`, `analyze()`, `classifyMessage()`),
   backend chosen by env (`AI_PROVIDER=api|ollama|vllm`). Ship on an API today.
2. Put **guardrails in the prompt**: "during a live contest, give hints only, never full code."
3. Add a **`classifyMessage(text)`** call the chat uses to block full-code (Phase 7.2).
4. Stand up **pgvector** in Postgres now (cheap) so RAG is ready later.
5. When ready, run **Ollama with `qwen2.5-coder`** in dev, then **vLLM** on a GPU box for prod — no product
   change needed because everything goes through `ai.service`.

---

## Hardest parts (be realistic)
1. **Running untrusted code safely** (P3) — start with Judge0/extension, not your own sandbox.
2. **Full statement scraping** (P1) — heavier + ToS/copyright care.
3. **Airtight anti-cheat** (P7) — impossible in a browser alone; combine signals, trust the server.
4. **Self-hosting an LLM** (P8) — needs a GPU + ops; start with an API.
5. **Always-on real-time** (P4/5) — Redis pub/sub is fine, but sockets don't like free-tier sleep.

## Recommended build order
**1 → 2 → 4 → 5 → 6 (API LLM) → 7 (anti-cheat) → 3 (Judge0) → 8 (self-host)**

---

## ✅ Implementation checklist
**Prototype (done)**
- [x] Paste-a-link problem entry in Create Contest
- [x] In-app problem viewer + code editor (write in CodeVault)
- [x] Live contest room: tabs, timer, leaderboard, Run/Submit (mock verdict)
- [x] Live chat in the room
- [x] AI hint button (hints only) + AI Assistant tab
- [x] Anti-cheat mock: in-app-only lock, chat full-code block, tab-switch warning + score penalty

**Backend / data**
- [ ] `Contest` + `ContestProblem` models; URL parser; per-platform statement fetcher
- [ ] Sanitize + cache fetched statements (ToS-aware)
- [ ] Realtime service (Socket.IO + Redis pub/sub): rooms, presence, scoreboard
- [ ] Live chat persistence (reuse `message.service`)
- [ ] Judge0 integration (native problems) + extension verdict path (imported)
- [ ] Server-authoritative scoring + penalty application

**AI / LLM**
- [ ] Provider-agnostic `ai.service` (`hint` / `analyze` / `classifyMessage`), env-selected backend
- [ ] Live-hint vs post-analysis modes + prompt guardrails
- [ ] Chat `classifyMessage` guard (block full code) — server-side
- [ ] pgvector enabled for future RAG
- [ ] Self-host path documented (Ollama → vLLM, Qwen2.5-Coder)

**Anti-cheat (P7)**
- [ ] In-app-only problem rendering (source locked during contest)
- [ ] Tab/focus detection → warning → server-applied score penalty
- [ ] Paste / code-similarity signals combined with focus
- [ ] Anti-abuse: rate-limit AI, prevent hint-farming

*Last updated: 2026-07-23.*
