# 📃 Open Source License

> If CodeVault's repo is public, it needs a clear license. Without one, "all rights reserved" applies by default and no one may legally use it.

| Field | Detail |
|-------|--------|
| **Overview** | The license file (e.g. `LICENSE`) declaring how others may use, modify, and distribute CodeVault's code. |
| **Purpose** | Define usage rights; protect the author; enable/limit reuse. |
| **Category** | ✅ Mandatory Before Launch (if repo is public) |
| **Why it is needed** | A public GitHub repo with no license = default copyright (no reuse rights), creating ambiguity. |
| **Legally required?** | No — but absence has strong legal default (all rights reserved). |
| **Technically required?** | No. |
| **When to implement** | At/ before making the repo public. |
| **Priority** | 🟠 High |
| **Estimated Cost** | $0. |
| **Renewal** | N/A. |
| **Official Website** | https://choosealicense.com · https://spdx.org/licenses/ |
| **Eligibility** | You own the copyright (see [COPYRIGHT](COPYRIGHT.md)). |

## Step-by-Step Process
1. Decide intent: permissive (MIT/Apache-2.0) vs copyleft (AGPL-3.0) vs proprietary/source-available.
2. Add a `LICENSE` file at repo root; set `license` in service `package.json` files.
3. If keeping it a product (not OSS), choose **proprietary / "all rights reserved"** + a `LICENSE` stating so.

## Required Documents
- Copyright ownership clarity; CLA if accepting contributions (see [CONTRIBUTOR_LICENSE_AGREEMENT](CONTRIBUTOR_LICENSE_AGREEMENT.md)).

## Implementation Guide
- **MIT** = simple, permissive. **Apache-2.0** = permissive + explicit patent grant. **AGPL-3.0** = network-copyleft (forces SaaS forks to open source).
- For a commercial SaaS you may keep the repo **private/proprietary** — then a license file is optional but a proprietary notice is wise.

## Best Practices
- Match the license to the business model; be consistent across `package.json` + `LICENSE`.
- Use SPDX identifiers.

## Common Mistakes
- Public repo with no license; conflicting licenses across packages; accepting contributions without a CLA/DCO.

## CodeVault-specific Notes
- CodeVault is currently a personal product; decide **proprietary** vs **OSS** before going public. If public + want to prevent unlicensed SaaS clones → AGPL-3.0; if building a community → MIT/Apache-2.0.
- Third-party deps' licenses must be compatible (run a license scan).

## Future Considerations
- Dual-licensing (OSS + commercial) if monetizing.
- License compliance scanning in CI.

## Checklist
- [ ] License decision made (proprietary vs OSS)
- [ ] `LICENSE` file at root
- [ ] `license` field in package.json files
- [ ] Dependency license scan clean
- [ ] CLA/DCO if accepting external contributions

## References
- [COPYRIGHT.md](COPYRIGHT.md) · [CONTRIBUTOR_LICENSE_AGREEMENT.md](CONTRIBUTOR_LICENSE_AGREEMENT.md) · [PATENTS.md](PATENTS.md)
- choosealicense.com · SPDX
