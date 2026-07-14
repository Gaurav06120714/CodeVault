# 04. CSRF Protection

## What it is
Cross-Site Request Forgery tricks a logged-in user's browser into making unwanted authenticated
requests. Defenses: anti-CSRF tokens, the OAuth `state` parameter, and using non-cookie auth
(bearer tokens aren't sent automatically cross-site).

## Applied to CodeVault
- **APIs authenticate with a Bearer JWT** in the `Authorization` header, **not** an ambient
  session cookie. Browsers don't attach `Authorization` automatically cross-site, so classic
  cookie-CSRF largely doesn't apply to the API.
- **OAuth `state` implemented** (`c8c708e`): the login page generates a random `state`, stores
  it in `sessionStorage`, and the callback **rejects** the code exchange unless GitHub echoes the
  same `state` back — closing OAuth login CSRF.
- **CORS** is restricted to the app origin on both services.

## Implementation checklist
- [x] OAuth `state` param generated + verified on callback (`c8c708e`)
- [x] Bearer-token auth (no ambient session cookie for the API)
- [x] CORS locked to the app origin
- [ ] If auth ever moves to cookies, add double-submit / SameSite CSRF tokens

**Status: ✅ Implemented for the current bearer-token model.**
