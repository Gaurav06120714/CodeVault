# 07. Authorization Checks (BOLA / access control)

## What it is
Beyond *authentication* (who you are), every endpoint must verify *authorization* (are you
allowed to touch **this** resource). Missing per-object checks = Broken Object-Level
Authorization (BOLA) — the #1 API vulnerability.

## Applied to CodeVault
- **`requireAuth` middleware** guards protected routes; the user id comes from the verified JWT
  (`req.user.userId`), never from the request body.
- **Ownership scoping:** git-service resolves repos/problems/connections **by `userId`**
  (`findUnique({ where: { userId_platform } })`, `problem.findMany({ where: { userId } })`) — a
  user can only ingest/read their own data.
- **RLS backstop** (`database/rls.sql`) is **enabled at the DB** as defense-in-depth, but is
  **currently inert**: the app connects as the superuser `codevault` (which bypasses RLS) and
  doesn't yet set the `app.current_user_id` GUC. See [DATABASE_SECURITY.md](DATABASE_SECURITY.md).

## Implementation checklist
- [x] `requireAuth` on protected routes; identity from JWT, not the payload
- [x] Per-object ownership scoping by `userId` in queries (app-layer BOLA defense)
- [~] RLS enabled in DB but **not enforcing** (app uses superuser + no GUC yet)
- [ ] Dedicated BOLA test suite across every endpoint

**Status: ✅ App-layer authorization done; 🟠 RLS backstop pending app wiring.**
