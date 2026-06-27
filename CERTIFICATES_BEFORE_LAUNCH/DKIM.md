# 🔏 DKIM (DomainKeys Identified Mail)

> Cryptographically signs CodeVault's outbound email so receivers can verify it wasn't forged or altered.

| Field | Detail |
|-------|--------|
| **Overview** | A DNS-published public key + per-message signature added by the mail provider. |
| **Purpose** | Authenticate sender + ensure message integrity. |
| **Category** | ⭐ Strongly Recommended Before Launch (if sending email) |
| **Why it is needed** | Required (with SPF) for DMARC alignment + inbox placement. |
| **Legally required?** | No. |
| **Technically required?** | Required for reliable delivery + DMARC. |
| **When to implement** | Before sending email. |
| **Priority** | 🟠 High (when email is added) |
| **Estimated Cost** | $0. |
| **Renewal** | Rotate keys periodically (provider-managed). |
| **Official Website** | https://www.rfc-editor.org/rfc/rfc6376 |
| **Eligibility** | Domain control + a mail provider. |

## Step-by-Step Process
1. Enable DKIM in the email provider; it gives a selector + public key.
2. Publish the TXT/CNAME record (e.g. `<selector>._domainkey.<domain>`).
3. Send a test; verify the signature passes; pair with DMARC.

## Required Documents
- None.

## Implementation Guide
- Provider signs each message with the private key; receivers fetch the public key via DNS.
- Use 2048-bit keys; rotate via selector swap.

## Best Practices
- 2048-bit keys; periodic rotation; align the signing domain with the From domain (for DMARC).

## Common Mistakes
- Mismatched selector/record; weak 1024-bit keys; no DMARC to enforce.

## CodeVault-specific Notes
- N/A until email ships; configure alongside SPF + DMARC on the sending (sub)domain.

## Future Considerations
- Automated key rotation; BIMI (logo in inbox) after DMARC enforcement.

## Checklist
- [ ] DKIM enabled at provider
- [ ] Selector record published
- [ ] 2048-bit key; test passes
- [ ] Aligned with From domain
- [ ] Paired with SPF + DMARC

## References
- [SPF.md](SPF.md) · [DMARC.md](DMARC.md) · [EMAIL_AUTHENTICATION.md](EMAIL_AUTHENTICATION.md)
- RFC 6376
