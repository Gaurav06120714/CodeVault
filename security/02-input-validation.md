# 02. Input Validation & Sanitization (XSS)

## What it is
Validate and sanitize every piece of incoming data (request bodies, query params, captured
content) so malformed or malicious input can't be stored or reflected — the core defense
against Cross-Site Scripting (XSS) and bad data.

## Applied to CodeVault
- **web-backend** validates request bodies with **Zod** schemas (`validate.middleware.ts`).
- **git-service** validates `/api/ingest` and sync payloads with validators
  (`validators/ingest.validator.ts`) — captured submissions are length-capped and typed.
- **Frontend** is React, which **escapes interpolated values by default** (no `dangerouslySetInnerHTML` on user data).
- The **extension** converts a problem statement's HTML → Markdown for `question.md`; that file
  is rendered by **GitHub**, not the app, so it's not an in-app XSS sink. Still, the code path
  strips tags rather than executing them.

## Implementation checklist
- [x] Zod validation on web-backend request bodies
- [x] Payload validation + length caps on git-service ingest/sync
- [x] React auto-escaping on the frontend
- [~] Central output-encoding review for any future rich-text render surface
- [ ] Fuzz/negative-input test suite

**Status: ✅ Implemented (backend Zod + React escaping); expand tests before launch.**
