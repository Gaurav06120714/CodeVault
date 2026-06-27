# 🏢 SOC 2 Type 1

> An auditor's point-in-time attestation that CodeVault's security controls are *designed* appropriately. The first step toward enterprise trust — **not needed pre-launch**.

| Field | Detail |
|-------|--------|
| **Overview** | AICPA SOC 2 Type 1 report attesting control **design** at a moment in time (Trust Services Criteria: Security, etc.). |
| **Purpose** | Evidence for enterprise procurement that controls exist + are well-designed. |
| **Category** | 🏢 Enterprise Only |
| **Why it is needed** | Enterprise customers require SOC 2 before buying; **not** needed for a self-serve consumer launch. |
| **Legally required?** | No. |
| **Technically required?** | No. |
| **When to implement** | When pursuing enterprise customers (post product-market fit). |
| **Priority** | 🏢 Deferred (enterprise) |
| **Estimated Cost** | $10k–$30k (Type 1) incl. tooling (Vanta/Drata) + auditor. |
| **Renewal** | Type 1 is point-in-time; progress to Type 2 (period-based). |
| **Official Website** | https://www.aicpa-cima.com |
| **Eligibility** | Documented controls + an auditor. |

## Step-by-Step Process
1. Pick scope (Security TSC at minimum).
2. Implement controls + policies (this knowledge base is the foundation).
3. Use a compliance platform (Vanta/Drata) to map evidence.
4. Engage a CPA firm for the Type 1 audit.

## Required Documents
- Policies (access, IR, BCP, change mgmt), system description, evidence.

## Implementation Guide
- CodeVault's existing security docs + policies map directly to many TSC controls — reuse them.

## Best Practices
- Start with Type 1 to validate design, then Type 2 for operating effectiveness; automate evidence.

## Common Mistakes
- Pursuing SOC 2 too early (cost with no enterprise demand); manual evidence sprawl.

## CodeVault-specific Notes
- **Not required now** (no enterprise customers, no payments). Begin only when enterprise deals demand it; this folder pre-stages the policies.

## Future Considerations
- Progress to [SOC2_TYPE2](SOC2_TYPE2.md); often paired with [ISO_27001](ISO_27001.md).

## Checklist
- [ ] Enterprise demand confirmed (trigger)
- [ ] Scope (TSC) chosen
- [ ] Controls + policies in place
- [ ] Compliance tooling + auditor engaged

## References
- [SOC2_TYPE2.md](SOC2_TYPE2.md) · [ISO_27001.md](ISO_27001.md) · [SECURE_DEVELOPMENT_LIFECYCLE.md](SECURE_DEVELOPMENT_LIFECYCLE.md)
- AICPA SOC 2
