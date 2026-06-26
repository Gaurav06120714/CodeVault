# 📄 Privacy Policy

> A public, accurate Privacy Policy is legally required the moment CodeVault collects personal data (GitHub email, handles) — i.e. at launch.

| Field | Detail |
|-------|--------|
| **Overview** | A user-facing document describing what personal data CodeVault collects, why, how it's stored/shared, and users' rights. |
| **Purpose** | Legal compliance + user trust + transparency about token handling. |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | CodeVault stores GitHub email/handle, connection handles, and **encrypted third-party tokens** — all personal/sensitive. |
| **Legally required?** | **Yes** — GDPR (EU), CCPA (CA), and most jurisdictions require it when collecting PII. |
| **Technically required?** | No (but app stores must have it; GitHub OAuth review may check). |
| **When to implement** | Before launch; linked in footer + at connect-authorize. |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | $0 (self-drafted from a template) → $500–$2k (lawyer review) for production. |
| **Renewal** | Review on any data-practice change; version + date it. |
| **Official Website** | https://gdpr.eu · https://oag.ca.gov/privacy/ccpa |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Inventory data collected (see [DATA_RETENTION_POLICY](DATA_RETENTION_POLICY.md) + [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md)).
2. Draft sections: data collected, purpose, legal basis, sharing (sub-processors: GitHub, hosting, Cloudflare), retention, rights, contact.
3. Disclose **platform session-token storage** explicitly (ToS risk).
4. Publish at `/privacy`; link from footer + consent flow; have counsel review pre-scale.

## Required Documents
- Data inventory; sub-processor list; DPA references.

## Implementation Guide
- Static page in `web-frontend` (marketing route). Include export/delete instructions.
- Record consent timestamp in `audit_logs` at connect-authorize.

## Best Practices
- Plain language; data minimization stance; name sub-processors; provide a contact.
- Keep in sync with actual code behavior (don't over-promise).

## Common Mistakes
- Generic copied policy that misstates what's collected.
- Omitting the third-party token storage disclosure.
- No update/version date.

## CodeVault-specific Notes
- Disclose: GitHub email/handle, encrypted platform/GitHub tokens, derived stats; **no passwords, no code in DB, no payment data**.
- Mirror [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md) (deletion purges tokens; export available).

## Future Considerations
- Per-region addenda (EEA/UK/CA); cookie banner if non-essential cookies added.
- DPA portal for enterprise customers.

## Checklist
- [ ] `/privacy` page live, linked in footer + consent flow
- [ ] Accurate data inventory + sub-processors listed
- [ ] Token-storage risk disclosed
- [ ] Rights (access/export/delete) + contact included
- [ ] Versioned + dated; counsel review before scale

## References
- [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) · [COOKIE_POLICY.md](COOKIE_POLICY.md) · [GDPR.md](GDPR.md) · [CCPA.md](CCPA.md) · [../docs/COMPLIANCE.md](../docs/COMPLIANCE.md)
