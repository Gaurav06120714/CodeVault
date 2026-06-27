# 📄 End User License Agreement (EULA)

> Governs how end users may use CodeVault's software/service. For a web SaaS, the Terms of Service usually serves this role.

| Field | Detail |
|-------|--------|
| **Overview** | A license defining permitted use of CodeVault by end users. |
| **Purpose** | Grant a limited use license; restrict misuse; disclaim warranties. |
| **Category** | 🟡 Recommended After Launch |
| **Why it is needed** | For a hosted SaaS, the [TERMS_OF_SERVICE](TERMS_OF_SERVICE.md) typically covers this; a separate EULA matters for distributed/desktop software. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | After launch, or skip if ToS suffices. |
| **Priority** | 🟡 Low |
| **Estimated Cost** | $0 (template). |
| **Renewal** | On change. |
| **Official Website** | — |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Decide: SaaS (ToS covers it) vs distributed binaries (EULA needed).
2. If needed, draft license grant + restrictions + warranty disclaimer + liability cap.
3. Present at install/first use.

## Required Documents
- None.

## Implementation Guide
- CodeVault is web-delivered → fold EULA terms into [TERMS_OF_SERVICE](TERMS_OF_SERVICE.md). Create a standalone EULA only if a CLI/desktop/extension is distributed.

## Best Practices
- Don't duplicate ToS; one source of truth; clear acceptance.

## Common Mistakes
- Maintaining conflicting ToS + EULA; unclear acceptance.

## CodeVault-specific Notes
- Currently **not needed** — ToS is sufficient for the web app. Revisit if a downloadable client ships.

## Future Considerations
- Separate EULA if a desktop/CLI/IDE extension is released.

## Checklist
- [ ] Decide SaaS (ToS) vs distributed (EULA)
- [ ] Avoid ToS/EULA conflict
- [ ] Acceptance flow if standalone

## References
- [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) · [OPEN_SOURCE_LICENSE.md](OPEN_SOURCE_LICENSE.md)
