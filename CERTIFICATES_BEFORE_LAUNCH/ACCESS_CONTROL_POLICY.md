# 🔐 Access Control Policy

> Defines who can access what — in the app (user/admin), the infrastructure, and the codebase. CodeVault's app-layer access control is already enforced in code.

| Field | Detail |
|-------|--------|
| **Overview** | Policy governing authentication, authorization, and least-privilege across app, infra, and repo. |
| **Purpose** | Prevent unauthorized access to user data, secrets, and production. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | CodeVault holds third-party tokens; weak access control = mass takeover. |
| **Legally required?** | Indirectly (data-protection; ISO/SOC2 control if pursued). |
| **Technically required?** | **Yes** for app authZ; policy formalizes infra/repo access. |
| **When to implement** | Before launch (app authZ done; infra policy at deploy). |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | $0. |
| **Renewal** | Quarterly access review. |
| **Official Website** | https://owasp.org (Access Control Cheat Sheet) |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Define roles: app `user`/`admin`; infra `developer`/`deployer`; repo maintainer/reviewer.
2. Enforce app authZ: ownership from JWT, `requireAuth`/`requireAdmin`, default-deny.
3. Infra: least-privilege cloud IAM, MFA, break-glass + audited prod access.
4. Repo: branch protection, required review, no force-push.

## Required Documents
- Role matrix; access-review log.

## Implementation Guide
- App: `req.user.id` from JWT only; every query filters `userId`; per-service DB roles (`cv_web`/`cv_git`).
- CI/CD: OIDC short-lived creds; separate build vs deploy roles.

## Best Practices
- Least privilege + need-to-know; MFA everywhere; quarterly reviews; revoke on offboarding.

## Common Mistakes
- Shared admin accounts; standing prod access; no offboarding.
- Over-privileged DB users (single superuser for all services).

## CodeVault-specific Notes
- Already enforced: ownership checks, field allowlists, per-service Postgres roles (see [../docs/DATABASE_SECURITY.md](../docs/DATABASE_SECURITY.md), [../docs/AUTH_SECURITY.md](../docs/AUTH_SECURITY.md)).
- Aishwarya + Gaurav are the maintainers; branch protection on `main`.

## Future Considerations
- Finer RBAC (moderator) if teams/orgs arrive; SSO for internal tools; just-in-time prod access.

## Checklist
- [ ] App authZ: ownership + role checks (done)
- [ ] Per-service least-privilege DB roles
- [ ] MFA on cloud/registrar/GitHub
- [ ] Branch protection + required review
- [ ] Quarterly access review; offboarding process

## References
- [PASSWORD_POLICY.md](PASSWORD_POLICY.md) · [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md) · [../docs/AUTH_SECURITY.md](../docs/AUTH_SECURITY.md) · [../docs/DATABASE_SECURITY.md](../docs/DATABASE_SECURITY.md)
