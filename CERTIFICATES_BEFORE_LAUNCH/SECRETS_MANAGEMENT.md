# 🔑 Secrets Management

> CodeVault's crown-jewel keys (`JWT_SECRET`, `ENCRYPTION_KEY`, GitHub secret, DB/Redis URLs) must be stored, injected, and rotated safely before launch.

| Field | Detail |
|-------|--------|
| **Overview** | Policy + tooling for storing and rotating application secrets. |
| **Purpose** | Prevent secret leakage; enable rotation without downtime. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | A leaked `ENCRYPTION_KEY` exposes every stored platform/GitHub token. |
| **Legally required?** | Indirectly (data-protection "appropriate security"). |
| **Technically required?** | **Yes.** |
| **When to implement** | Before launch (dev already uses gitignored `.env`). |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | $0 (GitHub Actions secrets, cloud SM free tier) → modest at scale (Vault). |
| **Renewal** | Rotate per policy (90 days for crypto keys; on incident). |
| **Official Website** | https://www.vaultproject.io · cloud provider secret managers |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Keep `.env` gitignored (done); `.env.example` committed.
2. Prod: store secrets in a secret manager; master key in **KMS**.
3. Inject at runtime (env), never bake into images.
4. Configure rotation: `keyVersion` columns enable zero-downtime key rotation.

## Required Documents
- Secret inventory + ownership + rotation schedule.

## Implementation Guide
- `config/env.ts` (Zod) validates all secrets at boot (fail-fast) in both services.
- `JWT_SECRET` + `ENCRYPTION_KEY` **identical** across services.
- gitleaks in CI + pre-commit (see [../docs/DEVSECOPS.md](../docs/DEVSECOPS.md)).

## Best Practices
- Least privilege; per-env secret sets; never log secrets (pino redaction).
- Dual-key window when rotating `JWT_SECRET` to avoid mass logout.

## Common Mistakes
- Secrets committed to git or baked into Docker images.
- Real secret in `NEXT_PUBLIC_*` (shipped to browser).
- `ENCRYPTION_KEY` mismatch between services → decrypt failures.

## CodeVault-specific Notes
- Mirrors [../docs/SECRETS.md](../docs/SECRETS.md). `.dockerignore` excludes `.env`.
- git-service decrypts tokens in-memory only; never persisted in plaintext.

## Future Considerations
- Automated rotation pipeline; dynamic DB credentials (Vault DB engine).

## Checklist
- [ ] `.env` gitignored; `.env.example` committed
- [ ] Prod secrets in manager; master key in KMS
- [ ] Boot-time validation (fail-fast)
- [ ] gitleaks in CI + pre-commit
- [ ] Rotation schedule + `keyVersion` ready
- [ ] No secret in client bundle

## References
- [../docs/SECRETS.md](../docs/SECRETS.md) · [../docs/DEVSECOPS.md](../docs/DEVSECOPS.md) · [ACCESS_CONTROL_POLICY.md](ACCESS_CONTROL_POLICY.md)
- OWASP Secrets Management Cheat Sheet
