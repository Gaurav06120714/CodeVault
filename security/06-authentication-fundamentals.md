# 06. Authentication Fundamentals

## What it is
Use established auth libraries and proven practices (hash + salt passwords, signed tokens,
short expiries) rather than rolling your own.

## Applied to CodeVault
- **Passwordless by design** — two flows, no passwords stored, so no password hashing surface:
  - **GitHub OAuth** (authorization-code flow) via GitHub as the identity provider.
  - **Email magic-link** — a single-use token (`crypto.randomBytes(32)`), 15-min expiry, stored
    in `verification_tokens`, verified on redeem.
- **Sessions = signed JWT** (`jsonwebtoken`), `JWT_SECRET` ≥ 32 chars, shared so both services
  verify the same token. See [AUTH_SECURITY.md](AUTH_SECURITY.md).
- Platform/GitHub tokens **encrypted at rest** (`ENCRYPTION_KEY`, AES) — see [SECRETS.md](SECRETS.md).

## Implementation checklist
- [x] Established libraries (GitHub OAuth, `jsonwebtoken`) — no custom crypto
- [x] Passwordless (no password storage/hashing needed)
- [x] Magic-link tokens are single-use, random, short-lived (15 min)
- [x] JWT signed with a ≥32-char secret
- [ ] Short JWT expiry + **refresh-token rotation** (currently ~7-day, no rotation)

**Status: ✅ Implemented; add refresh-token rotation before launch.**
