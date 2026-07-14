# 05. No Secrets in Local Storage / Client Code

## What it is
Never hardcode API keys or keep plain-text secrets in client-side code or `localStorage` —
anyone can open DevTools (network tab / console / storage) and read them.

## Applied to CodeVault
- **No API keys or client secrets in the frontend bundle.** `NEXT_PUBLIC_GITHUB_CLIENT_ID` is a
  **public** OAuth client ID (safe by design). The GitHub **client secret** lives only in
  `web-backend/.env` (server-side).
- Platform/GitHub access tokens are **never** in the browser — encrypted in the DB, backend-only.
- **Gap:** the **JWT** is stored in `localStorage`. It's a short-lived bearer credential, not a
  static secret, but it is client-readable — tracked under [14-secure-cookies.md](14-secure-cookies.md)
  and [03-no-sensitive-data-in-browser.md](03-no-sensitive-data-in-browser.md).
- CI runs **gitleaks** to catch secrets committed to the repo.

## Implementation checklist
- [x] No API keys / client secrets in frontend code or bundle
- [x] GitHub client secret server-side only; only the public client ID is exposed
- [x] gitleaks secret-scan in CI
- [ ] JWT out of `localStorage` (httpOnly cookie)
- [ ] Rotate the dev GitHub client secret (was shared in chat during setup)

**Status: 🟠 Partial — no hardcoded secrets, but JWT in `localStorage` + one secret to rotate.**
