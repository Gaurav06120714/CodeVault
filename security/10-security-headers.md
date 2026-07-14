# 10. Basic Security Headers

## What it is
HTTP response headers that harden the browser environment: `Content-Security-Policy`,
`X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, etc.

## Applied to CodeVault
- **Helmet** is applied on **both** backends (`web-backend/src/app.ts`, `git-service/src/app.ts`),
  which sets a sensible default set of security headers (frame-guard, no-sniff, HSTS scaffolding,
  etc.).
- The **browser extension** ships a strict MV3 CSP in `manifest.config.ts`
  (`script-src 'self'; object-src 'self'`).
- **To verify/tighten before launch:** an explicit **Content-Security-Policy** for the Next.js
  frontend (Helmet on the API doesn't cover the frontend responses), and HSTS once on HTTPS.

## Implementation checklist
- [x] Helmet security headers on web-backend + git-service
- [x] Strict CSP in the extension manifest
- [ ] Explicit CSP for the Next.js frontend responses
- [ ] HSTS enabled in production (needs HTTPS)

**Status: ✅ APIs + extension; 🟠 frontend CSP + HSTS pending. See [BACKEND_SECURITY.md](BACKEND_SECURITY.md).**
