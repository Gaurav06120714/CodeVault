# 09. SQL Injection Prevention

## What it is
Never build SQL by concatenating user input. Use an ORM / parameterized queries so inputs are
always treated as data, never executable SQL.

## Applied to CodeVault
- **Prisma ORM everywhere.** All DB access goes through Prisma Client (`prisma.problem.findMany`,
  `upsert`, etc.), which sends **parameterized queries** — user input is never interpolated into
  raw SQL.
- **Typed schema** (Prisma schema + generated types) plus **Zod** validation at the edge means
  inputs are shape-checked before they reach the DB layer.
- No `queryRaw`/`$executeRaw` with interpolated user input in the codebase.
- **Note:** RLS uses a `SET`-based GUC, not string-built SQL (see [DATABASE_SECURITY.md](DATABASE_SECURITY.md)).

## Implementation checklist
- [x] Prisma ORM for all queries (parameterized)
- [x] Typed schema + Zod input validation
- [x] No raw SQL built from user input
- [ ] Lint/CI guard against future `$queryRawUnsafe` usage

**Status: ✅ Implemented.**
