# 🤝 Responsible Disclosure

> The researcher-facing companion to the VDP: the etiquette + process for coordinated disclosure of CodeVault vulnerabilities.

| Field | Detail |
|-------|--------|
| **Overview** | Guidelines asking reporters to disclose privately first and coordinate a fix timeline. |
| **Purpose** | Protect users by fixing issues before public disclosure. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | Prevents 0-day drops; builds researcher goodwill. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | With the VDP. |
| **Priority** | 🟢 Medium |
| **Estimated Cost** | $0. |
| **Renewal** | Annual review. |
| **Official Website** | https://disclose.io |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Reporter contacts [SECURITY_CONTACT](SECURITY_CONTACT.md) privately.
2. CodeVault acknowledges (≤3 days), triages, agrees a disclosure window (e.g. 90 days).
3. Fix → coordinate public disclosure + credit.

## Required Documents
- VDP; contact.

## Implementation Guide
- Often merged into the [VULNERABILITY_DISCLOSURE_POLICY](VULNERABILITY_DISCLOSURE_POLICY.md); this file documents the *coordination* norms.

## Best Practices
- Private-first; reasonable timelines; transparency + credit; no legal threats for good-faith research.

## Common Mistakes
- Ignoring reports; threatening researchers; no agreed timeline.

## CodeVault-specific Notes
- Coordinate carefully on token-handling bugs (rotate keys + notify before public disclosure).

## Future Considerations
- CVD via a platform (HackerOne/Bugcrowd) at scale.

## Checklist
- [ ] Private-first process documented
- [ ] Ack ≤3 days; agreed disclosure window
- [ ] Credit/recognition
- [ ] Linked from security.txt + VDP

## References
- [VULNERABILITY_DISCLOSURE_POLICY.md](VULNERABILITY_DISCLOSURE_POLICY.md) · [SECURITY_CONTACT.md](SECURITY_CONTACT.md) · [BUG_BOUNTY_PROGRAM.md](BUG_BOUNTY_PROGRAM.md)
- disclose.io
