# ✅ Verified Sending Domain

> Proving to your email provider that CodeVault owns its sending domain — a prerequisite for authenticated, high-deliverability email.

| Field | Detail |
|-------|--------|
| **Overview** | Domain verification with the chosen ESP (DNS records confirming ownership + enabling DKIM). |
| **Purpose** | Unlock branded, authenticated sending from `@<domain>`. |
| **Category** | ⭐ Strongly Recommended Before Launch (if sending email) |
| **Why it is needed** | Without verification, email sends from a shared/provider domain (poor trust + branding). |
| **Legally required?** | No. |
| **Technically required?** | Required for branded sending. |
| **When to implement** | With email setup. |
| **Priority** | 🟠 High (when email is added) |
| **Estimated Cost** | $0 (DNS) + ESP plan. |
| **Renewal** | Re-verify on provider/domain change. |
| **Official Website** | ESP docs (Resend/Postmark/SES). |
| **Eligibility** | Domain DNS access. |

## Step-by-Step Process
1. Add the sending (sub)domain in the ESP.
2. Publish the verification + DKIM DNS records they provide.
3. Confirm verification; then configure SPF/DMARC.

## Required Documents
- None.

## Implementation Guide
- Use a subdomain like `mail.<domain>` or `notify.<domain>` to isolate reputation from the apex.

## Best Practices
- Separate subdomains for transactional vs marketing; warm up gradually at volume.

## Common Mistakes
- Sending from the apex with no isolation; skipping verification (lands in spam).

## CodeVault-specific Notes
- Tie the verified domain to [EMAIL_AUTHENTICATION](EMAIL_AUTHENTICATION.md); not needed until email ships.

## Future Considerations
- Dedicated IP at scale; regional sending domains.

## Checklist
- [ ] Sending subdomain added to ESP
- [ ] Verification + DKIM records published
- [ ] Verified status confirmed
- [ ] SPF/DMARC configured

## References
- [EMAIL_AUTHENTICATION.md](EMAIL_AUTHENTICATION.md) · [DKIM.md](DKIM.md) · [DNS_CONFIGURATION.md](DNS_CONFIGURATION.md)
