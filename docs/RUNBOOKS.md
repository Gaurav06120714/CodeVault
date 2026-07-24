# 🚨 CodeVault — Incident Runbooks & Launch Readiness

> Operational playbook for on-call. Operationalizes the tooling already in the repo:
> health checks, Prometheus `/metrics` + `observability/alerts.yml`, the sync
> **kill-switch** (`SYNC_ENABLED=false`), Sentry, and `scripts/backup.sh` / `restore.sh`.

---

## Incident response process

1. **Detect** — alert fires (`observability/alerts.yml`), synthetic uptime check, or user report.
2. **Triage** — assign severity (SEV1 = down/data-at-risk, SEV2 = degraded, SEV3 = minor).
   Post in the incident channel; assign an incident lead.
3. **Mitigate** — apply the matching runbook below. Prefer a fast lever (kill-switch, rollback)
   over a root-cause fix during the incident.
4. **Resolve** — confirm health checks green + alerts cleared; communicate all-clear.
5. **Postmortem** — within 48h, blameless writeup: timeline, impact, root cause, action items.

**Fast levers**
| Lever | How |
|-------|-----|
| Stop all syncing | Set `SYNC_ENABLED=false` on git-service, redeploy/restart |
| Roll back | Render → service → Events → **Rollback** to last green deploy |
| Restore DB | `scripts/restore.sh <backup>` into a scratch DB, verify, cut over |

---

## Top-5 runbooks

### R1 — Service down / health check failing
**Signals:** `ServiceDown` alert; `/api/health` or `/health` non-200; Render shows unhealthy.
1. Check Render **Events/Logs** for the service; look for crash loop or OOM.
2. If a recent deploy caused it → **Rollback** to the last green deploy.
3. If DB/Redis unreachable → see R5 (DB) / check `REDIS_URL`.
4. Confirm `healthCheckPath` recovers; watch `up == 1` in Prometheus.

### R2 — Sync-failure storm / token expiry
**Signals:** spike in sync failures; users report "session expired"; `ExpiredSessionError` in logs.
1. Set **`SYNC_ENABLED=false`** to stop the storm.
2. Inspect logs for whether it's one platform (upstream change) or broad (our bug).
3. If a single platform's scraper broke → patch the adapter; stats degrade to the **snapshot fallback** meanwhile.
4. Re-enable sync; monitor failure rate back to baseline.

### R3 — GitHub outage (publishing fails)
**Signals:** git-service errors calling GitHub; publish jobs failing; GitHub status page red.
1. Confirm via GitHub Status. If upstream → **pause the queue** / `SYNC_ENABLED=false`.
2. Jobs are queued (BullMQ) — they resume when GitHub recovers; no data loss.
3. After recovery, re-enable and drain the backlog (see R4).

### R4 — Queue backlog (BullMQ)
**Signals:** growing job counts; delayed publishes.
1. Check Redis health and worker liveness (git-service logs).
2. Scale worker concurrency via `SYNC_CONCURRENCY` / `SYNC_PLATFORM_CONCURRENCY` if the box has headroom.
3. If poisoned jobs → identify and remove; keep retry/backoff bounded to avoid hammering upstreams.

### R5 — Database incident / data loss
**Signals:** Postgres errors; `codevault-db` unavailable; bad migration.
1. Stop writes: `SYNC_ENABLED=false`; consider maintenance mode.
2. If a migration is at fault → roll back the deploy; use expand→contract migrations going forward.
3. Restore: `TARGET_DATABASE_URL=<scratch> BACKUP_PASSPHRASE=… ./scripts/restore.sh <latest-backup>`,
   verify row counts/checksums, then cut over. Targets: **RPO ≤ 15 min, RTO ≤ 1 hr**.

---

## Staged rollout plan (launch)
1. **10%** — internal + invited users; watch error rate, p95 latency, sync success for 24–48h.
2. **50%** — if SLOs hold and no SEV1/2; keep the kill-switch and rollback ready.
3. **100%** — general availability; announce, monitor closely for the first week.

Roll back a stage immediately on any SEV1, sustained 5xx > 5%, or p95 breaching SLO.

## Support & disclosure
- **Support/contact:** publish a support email + link it in the app footer.
- **Platform ToS:** monitor LeetCode/Codeforces/CodeChef/HackerRank ToS; keep the token-storage
  and scraping disclosure current in the CodeVault Terms of Service (see COMPLIANCE.md).

## ✅ Runbook readiness checklist
- [x] Incident response process documented
- [x] Top-5 incident runbooks written
- [x] Staged rollout plan
- [x] Kill-switch + rollback documented
- [ ] On-call roster / PagerDuty configured
- [ ] Quarterly restore drill executed
