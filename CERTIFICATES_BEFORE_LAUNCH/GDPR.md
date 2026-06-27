# 🇪🇺 GDPR

> EU data-protection law. CodeVault must be GDPR-ready before serving EU users — it processes personal data (email, handles) + sensitive tokens.

| Field | Detail |
|-------|--------|
| **Overview** | The General Data Protection Regulation governs processing of EU residents' personal data. |
| **Purpose** | Lawful, transparent, minimal data processing + user rights. |
| **Category** | ⭐ Strongly Recommended Before Launch (Mandatory if EU users) |
| **Why it is needed** | Any EU user triggers GDPR; fines up to 4% of global revenue / €20M. |
| **Legally required?** | **Yes** if you process EU residents' data. |
| **Technically required?** | Drives consent, export, deletion, retention, breach-notify. |
| **When to implement** | Before serving EU users (effectively at public launch). |
| **Priority** | 🔴 Critical (if EU) |
| **Estimated Cost** | $0 (self-serve) → legal review + DPO at scale. |
| **Renewal** | Ongoing; review on data-practice change. |
| **Official Website** | https://gdpr.eu · https://edpb.europa.eu |
| **Eligibility** | Applies by user geography, not company location. |

## Step-by-Step Process
1. Establish **lawful basis** (consent/contract) for each processing activity.
2. Publish Privacy Policy + consent at connect-authorize.
3. Implement **rights**: access, export, rectification, erasure.
4. Sign **DPAs** with sub-processors (GitHub, hosting, Cloudflare, ESP).
5. Define retention + breach-notification (**72h**).

## Required Documents
- Privacy Policy; Records of Processing (ROPA); DPAs; data inventory.

## Implementation Guide
- Data minimization: handles + encrypted tokens + derived stats; **no code/passwords/payments**.
- Deletion purges tokens + revokes sessions; export excludes secrets (see [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md)).

## Best Practices
- Privacy by design + default; minimal PII; document everything; honor rights promptly.

## Common Mistakes
- No lawful basis; no DPAs; ignoring deletion/export; missing 72h breach clock.

## CodeVault-specific Notes
- Highest-risk processing = storing platform session tokens → disclose + consent explicitly.
- Mirrors [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md) + [DATA_RETENTION_POLICY](DATA_RETENTION_POLICY.md).

## Future Considerations
- EU representative + DPO if scale/sensitivity require; SCCs for transfers.

## Checklist
- [ ] Lawful basis per activity
- [ ] Privacy Policy + consent flow
- [ ] Access/export/erasure implemented
- [ ] DPAs with sub-processors
- [ ] Retention + 72h breach process

## References
- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) · [CCPA.md](CCPA.md) · [DATA_RETENTION_POLICY.md](DATA_RETENTION_POLICY.md) · [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md)
- gdpr.eu · EDPB
