# 03. Don't Store Sensitive Data in the Browser

## What it is
Keep business logic, secrets, and privileged operations on the back end. The browser is fully
inspectable, so anything critical placed client-side can be read or bypassed.

## Applied to CodeVault
- **Logic lives server-side:** stats aggregation, GitHub push, token encryption/decryption, and
  ownership checks all run in `web-backend` / `git-service`. The frontend only renders data and
  calls authenticated APIs.
- **Platform + GitHub tokens** are stored **encrypted in Postgres** and **never sent to the
  browser** — only the backend decrypts them.
- **Gap:** the **JWT is kept in `localStorage`** (web app + extension read `localStorage('token')`).
  It's a bearer token, not a long-term secret, but `localStorage` is XSS-readable — see
  [14-secure-cookies.md](14-secure-cookies.md).

## Implementation checklist
- [x] Business logic + privileged ops confined to the backend
- [x] Platform/GitHub tokens encrypted server-side, never exposed to the client
- [ ] JWT moved out of `localStorage` into an httpOnly cookie (currently in `localStorage`)

**Status: 🟠 Partial — logic/secrets are server-side, but the JWT sits in `localStorage`.**
