# 11. DoS / DDoS Protection

## What it is
Protect against traffic floods and resource exhaustion — via a CDN/WAF with DDoS armor, plus
application-level rate limits and queue back-pressure.

## Applied to CodeVault
- **App-level rate limiting** exists (Redis fixed-window) on auth + ingest/sync endpoints —
  see [16-rate-limiting.md](16-rate-limiting.md).
- **Queue back-pressure:** git-service uses **BullMQ** with bounded concurrency
  (`SYNC_CONCURRENCY`, `SYNC_PLATFORM_CONCURRENCY`) so sync bursts can't overwhelm GitHub or the
  service.
- **Missing (needs deployment):** an edge **CDN/WAF with DDoS protection** (planned: Cloudflare —
  see [CLOUD_SECURITY.md](CLOUD_SECURITY.md)). Not applicable until the app is hosted publicly.

## Implementation checklist
- [x] Application rate limiting (Redis)
- [x] Queue concurrency limits / back-pressure (BullMQ)
- [ ] Edge CDN + WAF with DDoS protection (Cloudflare) at deploy
- [ ] Load/stress test to confirm graceful degradation

**Status: 🟠 Partial — app-level mitigations in place; edge DDoS armor pending deployment.**
