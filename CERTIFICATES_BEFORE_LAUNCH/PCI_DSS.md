# 💳 PCI DSS

> Payment-card security standard. **Not needed now** (CodeVault takes no payments). Becomes relevant only if paid plans are added — and even then, use a processor to minimize scope.

| Field | Detail |
|-------|--------|
| **Overview** | Payment Card Industry Data Security Standard for handling cardholder data. |
| **Purpose** | Protect card data; required to process card payments. |
| **Category** | 💰 Required Only if Payments Are Added |
| **Why it is needed** | **Only** if CodeVault processes/stores card data; today it doesn't. |
| **Legally required?** | Contractually required by card networks if you handle card data. |
| **Technically required?** | Only with direct card handling. |
| **When to implement** | When introducing paid plans/payments. |
| **Priority** | 💰 Deferred (payments only) |
| **Estimated Cost** | Near-$0 with a processor (SAQ A) → significant if handling cards directly. |
| **Renewal** | Annual (SAQ/RoC) + quarterly scans (some levels). |
| **Official Website** | https://www.pcisecuritystandards.org |
| **Eligibility** | Any merchant handling card data. |

## Step-by-Step Process
1. **Use a PCI-compliant processor** (Stripe/Paddle) — never touch raw card data.
2. Embed their hosted fields/checkout → CodeVault qualifies for the simplest **SAQ A**.
3. Complete the SAQ annually; keep TLS + access controls.

## Required Documents
- SAQ A (self-assessment) when payments launch.

## Implementation Guide
- Architect payments so card data **never** hits CodeVault servers (tokenized, processor-hosted). This keeps PCI scope minimal.
- Pricing is currently **deferred** (the `users.plan` field is reserved for future use).

## Best Practices
- Outsource card handling entirely; never log/store PANs; reconcile via webhooks (HMAC-verified).

## Common Mistakes
- Building a custom card form (massive PCI scope); storing card data; unverified payment webhooks.

## CodeVault-specific Notes
- **Not applicable today** — no payments. If/when paid plans arrive, use Stripe-hosted checkout (SAQ A) + verify webhooks per [API_SECURITY](../docs/API_SECURITY.md).

## Future Considerations
- Tax/invoicing + subscription management; SCA/3-D Secure via the processor.

## Checklist
- [ ] Payments feature confirmed (trigger)
- [ ] Processor-hosted card fields (no raw card data)
- [ ] SAQ A completed annually
- [ ] Webhooks HMAC-verified; TLS + access controls

## References
- [TERMS_OF_SERVICE.md](TERMS_OF_SERVICE.md) · [../docs/API_SECURITY.md](../docs/API_SECURITY.md) · [SECRETS_MANAGEMENT.md](SECRETS_MANAGEMENT.md)
- pcisecuritystandards.org
