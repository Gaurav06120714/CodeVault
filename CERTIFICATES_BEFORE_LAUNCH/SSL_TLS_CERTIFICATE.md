# 🔒 SSL/TLS Certificate

> Encrypts all traffic to CodeVault (`https://`). Non-negotiable for an app that handles OAuth, JWT cookies, and platform tokens.

| Field | Detail |
|-------|--------|
| **Overview** | A TLS certificate binds CodeVault's domain to a public key so browsers can establish encrypted, authenticated HTTPS sessions. |
| **Purpose** | Confidentiality + integrity of every request (login, cookies, API). |
| **Category** | ✅ Mandatory Before Launch |
| **Why it is needed** | CodeVault sets `Secure` httpOnly auth cookies and transmits OAuth codes — these are worthless without TLS; browsers also block secure cookies / mark the site "Not secure" over HTTP. |
| **Legally required?** | Indirectly — GDPR/CCPA "appropriate security" and PCI (if payments) effectively require encryption in transit. |
| **Technically required?** | **Yes.** Secure cookies, HSTS, OAuth, and modern browsers require HTTPS. |
| **When to implement** | Before any public deployment. |
| **Priority** | 🔴 Critical |
| **Estimated Cost** | **$0** (Let's Encrypt / Cloudflare Universal SSL) → $50–$300/yr for OV/EV if ever needed. |
| **Renewal** | Auto-renew every 90 days (Let's Encrypt) or managed by Cloudflare/Vercel. |
| **Official Website** | https://letsencrypt.org · https://www.cloudflare.com/ssl/ |
| **Eligibility** | Control of the domain (DNS or HTTP validation). |

## Step-by-Step Process
1. Register the domain (see [DOMAIN_REGISTRATION](DOMAIN_REGISTRATION.md)) and point DNS to Cloudflare.
2. Enable Cloudflare **Universal SSL** (edge cert) + set SSL mode **Full (strict)**.
3. Provision an **origin certificate** (Cloudflare Origin CA) on the backend load balancer / Vercel auto-manages the frontend cert.
4. Enforce HTTPS redirect + HSTS (see [HTTPS_CONFIGURATION](HTTPS_CONFIGURATION.md)).

## Required Documents
- Domain ownership proof (DNS access). No paper docs for DV certs.

## Implementation Guide
- **Frontend (Vercel):** automatic managed certs — no action beyond adding the domain.
- **Backend (`web-backend`/`git-service`):** terminate TLS at Cloudflare; LB validates Cloudflare origin cert (Authenticated Origin Pulls). Use TLS 1.2+/1.3 only.

## Best Practices
- TLS 1.2 minimum (prefer 1.3); strong ciphers; OCSP stapling.
- Full (strict) mode — encrypt edge→origin too, not just browser→edge.
- Automate renewal; alert on < 21 days to expiry.

## Common Mistakes
- "Flexible" SSL (plaintext edge→origin) — avoid; use Full (strict).
- Forgetting the origin cert (mixed/self-signed errors).
- Expired certs from broken auto-renew (no monitoring).

## CodeVault-specific Notes
- Two backend origins (`:4000`, `:5000/5050`) both behind Cloudflare; both need origin certs or AOP.
- Required for `Secure` cookies the auth flow depends on (see [../docs/AUTH_SECURITY.md](../docs/AUTH_SECURITY.md)).

## Future Considerations
- mTLS for internal service-to-service if a private mesh is added.
- EV/OV cert only if enterprise buyers demand it (rarely needed today).

## Checklist
- [ ] Domain on Cloudflare; Universal SSL on
- [ ] SSL mode Full (strict); origin cert on LBs
- [ ] TLS 1.2+/1.3 only; strong ciphers
- [ ] Auto-renew + expiry alerts
- [ ] HTTPS redirect + HSTS enabled

## References
- [HTTPS_CONFIGURATION.md](HTTPS_CONFIGURATION.md) · [SECURITY_HEADERS.md](SECURITY_HEADERS.md) · [../docs/CLOUD_SECURITY.md](../docs/CLOUD_SECURITY.md)
- Let's Encrypt docs · Cloudflare SSL/TLS docs · Mozilla SSL Config Generator
