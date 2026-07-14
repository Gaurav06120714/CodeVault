# 01. HTTPS Everywhere

## What it is
Encrypt all data in transit with TLS so credentials, JWTs, and API traffic can't be read or
tampered with on the wire (man-in-the-middle). The hosting platform should serve HTTPS by
default and redirect HTTP → HTTPS.

## Applied to CodeVault
- **Local dev** runs on plain `http://localhost` (3000 / 4000 / 5050) — acceptable for loopback.
- **Production is not deployed yet**, so no public TLS is configured. When deployed, the
  frontend (Vercel) and both APIs (Railway/Render/Fly + Cloudflare) must terminate TLS and
  force HTTPS, and the GitHub OAuth callback URL must be `https://`.
- The extension talks to `localhost` in dev; production must point at the HTTPS API hosts.

## Implementation checklist
- [ ] Production frontend served over HTTPS (HSTS enabled)
- [ ] Both APIs served over HTTPS; HTTP redirected
- [ ] `Secure` cookies / HTTPS-only OAuth callback in prod
- [x] Dev uses loopback (`localhost`) — TLS not required locally

**Status: ⬜ Pending — depends on deployment (see [../security/CLOUD_SECURITY.md](CLOUD_SECURITY.md)).**
