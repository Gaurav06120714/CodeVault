# 12. Keep Dependencies Updated

## What it is
Third-party packages are a top source of vulnerabilities. Routinely audit and update
dependencies (SCA) to remediate known CVEs.

## Applied to CodeVault
- **CI scanning is in place** (`.github/workflows`): typecheck, lint, **npm audit**, **gitleaks**
  (secrets), and **CodeQL** (SAST) run on pushes.
- **Open gap:** `npm audit` currently reports **moderate/high** advisories across workspaces
  (seen during installs) that haven't been remediated yet.
- **Housekeeping:** the CI actions themselves use `actions/checkout@v4` / `setup-node@v4`, which
  GitHub is deprecating (Node 20) — bump to `@v5`.

## Implementation checklist
- [x] CI runs `npm audit` + CodeQL + gitleaks on push
- [ ] Resolve outstanding `npm audit` moderate/high advisories
- [ ] Add Dependabot / Renovate for automated update PRs
- [ ] Bump CI actions off deprecated Node-20 versions (`@v4` → `@v5`)

**Status: 🟠 Partial — scanning exists; outstanding advisories + automation pending. See [DEVSECOPS.md](DEVSECOPS.md).**
