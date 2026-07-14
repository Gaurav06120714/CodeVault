# 14. Secure Cookies

## What it is
If sessions use cookies, set `HttpOnly` (JS can't read them → XSS-safe), `Secure` (HTTPS only),
and `SameSite` (CSRF-resistant) to prevent token theft/hijacking.

## Applied to CodeVault
- **This is the biggest open gap.** CodeVault does **not** use cookies for auth — the **JWT is
  stored in `localStorage`** (the web app writes `localStorage('token')`, and the extension reads
  it same-origin). `localStorage` is **readable by any script**, so an XSS would expose the token.
- **Why it's this way today:** the browser extension currently reads the JWT from `localStorage`
  to authenticate as the same user. Moving to an httpOnly cookie requires a different handoff to
  the extension (e.g. a scoped token-exchange endpoint).

## Recommended fix
1. Issue the JWT as an **`HttpOnly; Secure; SameSite=Lax`** cookie from the backend.
2. Give the extension a **dedicated token-exchange** path (it can't read httpOnly cookies).
3. Remove `localStorage('token')` from the web app.

## Implementation checklist
- [ ] JWT issued as `HttpOnly` cookie
- [ ] `Secure` flag (HTTPS) in production
- [ ] `SameSite=Lax/Strict`
- [ ] Extension token handoff reworked off `localStorage`

**Status: ⬜ Not implemented — JWT lives in `localStorage`. Highest-impact remaining item.**
