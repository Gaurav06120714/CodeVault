# CodeVault — Observability configs

Version-controlled monitoring definitions. The app already emits the signals;
these files turn them into dashboards + alerts. Ops still runs the collectors.

## What the app already exposes (in code)
- **Structured JSON logs** with **secret redaction** on both backends (pino).
- **`X-Request-Id`** minted/propagated per request for cross-service correlation.
- **Prometheus metrics**: `web-backend` at `/api/metrics`, `git-service` at `/metrics`
  (default Node/process metrics + `http_request_duration_seconds` histogram).

## Files
| File | Purpose |
|------|---------|
| `prometheus.yml` | Scrape config for both services |
| `alerts.yml` | Alerting rules: service down, 5xx rate, p95 latency SLO burn, event-loop lag |
| `grafana-dashboard.json` | RED dashboard (rate / errors / p95 duration / lag) — import into Grafana |

## Quick start (self-hosted)
```bash
# From this directory, run Prometheus + Grafana pointed at the compose network
docker run -d --name prometheus -p 9090:9090 \
  -v "$PWD/prometheus.yml:/etc/prometheus/prometheus.yml" \
  -v "$PWD/alerts.yml:/etc/prometheus/alerts.yml" prom/prometheus
docker run -d --name grafana -p 3001:3000 grafana/grafana
# In Grafana: add Prometheus (http://prometheus:9090) datasource, then import grafana-dashboard.json
```

## Still requires external accounts (not code)
- **Alertmanager receiver** → PagerDuty / Slack / email (`alertmanager.yml`)
- **Sentry** → set `SENTRY_DSN` (wiring is env-gated in the backends; no-op when unset)
- **Status page** → Instatus / Statuspage, linked from the app footer
- **Synthetic uptime checks** → hit `/api/health` + `/health` from multiple regions
  (UptimeRobot / BetterStack)
