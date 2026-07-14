<div align="center">

# 🛡️ CodeVault — Security

Security posture mapped to the **16-point "vibe-code securely" checklist**, plus the detailed
per-area blueprints. Each numbered file explains the control and ends with an implementation
checklist verified against the actual code.

</div>

---

## 📊 Scorecard — the 16 controls

| # | Control | Status |
|:-:|---------|:------:|
| [01](01-https-everywhere.md) | HTTPS everywhere | ⬜ Pending (deploy) |
| [02](02-input-validation.md) | Input validation & sanitization (XSS) | ✅ Implemented |
| [03](03-no-sensitive-data-in-browser.md) | No sensitive data in the browser | 🟠 Partial |
| [04](04-csrf-protection.md) | CSRF protection | ✅ Implemented |
| [05](05-no-secrets-in-local-storage.md) | No secrets in local storage | 🟠 Partial |
| [06](06-authentication-fundamentals.md) | Authentication fundamentals | ✅ Implemented |
| [07](07-authorization-checks.md) | Authorization checks (BOLA) | ✅ App-layer · 🟠 RLS pending |
| [08](08-api-endpoint-protection.md) | API endpoint protection | ✅ Implemented |
| [09](09-sql-injection-prevention.md) | SQL injection prevention | ✅ Implemented |
| [10](10-security-headers.md) | Basic security headers | ✅ APIs · 🟠 FE CSP |
| [11](11-dos-protection.md) | DoS / DDoS protection | 🟠 Partial |
| [12](12-keep-dependencies-updated.md) | Keep dependencies updated | 🟠 Partial |
| [13](13-error-handling.md) | Proper error handling | 🟠 Partial |
| [14](14-secure-cookies.md) | Secure cookies | ⬜ Not (JWT in localStorage) |
| [15](15-file-upload-security.md) | File upload security | ✅ N/A by design |
| [16](16-rate-limiting.md) | Rate limiting | ✅ Implemented |

**Legend:** ✅ implemented · 🟠 partial · ⬜ not yet / pending deployment.

### Top open items (by impact)
1. **#14 Secure cookies** — move the JWT out of `localStorage` into an `HttpOnly` cookie.
2. **#07 RLS** — enable enforcement (app must use `cv_web`/`cv_git` + set the `app.current_user_id` GUC).
3. **#01 HTTPS / #11 DDoS** — land at deployment (Cloudflare + HTTPS).
4. **#12 Dependencies** — clear outstanding `npm audit` advisories + add Dependabot.
5. **#13 Error handling** — scrub raw `error.message` from client responses.

---

## 📚 Detailed blueprints (moved from `docs/`)

| Area | Doc |
|------|-----|
| Master threat model / OWASP | [SECURITY_PLAN.md](SECURITY_PLAN.md) |
| Auth (OAuth, JWT, refresh, RBAC) | [AUTH_SECURITY.md](AUTH_SECURITY.md) |
| API (OWASP API Top 10, HMAC) | [API_SECURITY.md](API_SECURITY.md) |
| Backend hardening | [BACKEND_SECURITY.md](BACKEND_SECURITY.md) |
| Database (encryption, roles, RLS) | [DATABASE_SECURITY.md](DATABASE_SECURITY.md) |
| Redis (ACL, TLS, locks) | [REDIS_SECURITY.md](REDIS_SECURITY.md) |
| Queue (BullMQ, DLQ, backoff) | [QUEUE_SECURITY.md](QUEUE_SECURITY.md) |
| GitHub (OAuth, token encryption) | [GITHUB_SECURITY.md](GITHUB_SECURITY.md) |
| Browser extension | [EXTENSION_SECURITY.md](EXTENSION_SECURITY.md) |
| File upload | [FILE_UPLOAD_SECURITY.md](FILE_UPLOAD_SECURITY.md) |
| Infrastructure | [INFRASTRUCTURE_SECURITY.md](INFRASTRUCTURE_SECURITY.md) |
| Cloud (WAF, DDoS, TLS) | [CLOUD_SECURITY.md](CLOUD_SECURITY.md) |
| Secrets (env, KMS, rotation) | [SECRETS.md](SECRETS.md) |
| DevSecOps (CI/CD, SCA) | [DEVSECOPS.md](DEVSECOPS.md) |
| Secure development | [SECURE_DEVELOPMENT.md](SECURE_DEVELOPMENT.md) |
| Security testing (DAST, pentest) | [SECURITY_TESTING.md](SECURITY_TESTING.md) |
| Attack prevention (40+ mapped) | [ATTACK_PREVENTION.md](ATTACK_PREVENTION.md) |

> Live, code-verified feature status lives in [`../docs/PROGRESS.md`](../docs/PROGRESS.md) and
> [`../docs/FEATURES.md`](../docs/FEATURES.md).
