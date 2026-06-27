# 🤖 robots.txt

> Controls which crawlers may index CodeVault — keep public marketing + profiles indexable, keep authenticated app routes out.

| Field | Detail |
|-------|--------|
| **Overview** | A root `/robots.txt` directing search-engine crawlers. |
| **Purpose** | Allow indexing of public pages; disallow private/app routes; point to the sitemap. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | Prevents indexing of `/app/*` (authed) while letting `/` and `/u/:username` rank. |
| **Legally required?** | No. |
| **Technically required?** | No (SEO/hygiene). |
| **When to implement** | Before launch. |
| **Priority** | 🟢 Low effort |
| **Estimated Cost** | $0. |
| **Renewal** | Update as routes change. |
| **Official Website** | https://www.robotstxt.org |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Create `web-frontend/public/robots.txt` (or generate via Next metadata route).
2. Allow `/`, `/u/`, legal pages; disallow `/app/`, `/api/`, `/connect`.
3. Add `Sitemap: https://<domain>/sitemap.xml`.

## Required Documents
- None.

## Implementation Guide
- `robots.txt` is advisory only — **never** rely on it for security; protect private routes with auth (already done) + `noindex` headers.

## Best Practices
- Disallow authed/app paths; reference sitemap; keep public profiles indexable for shareability.

## Common Mistakes
- Using robots.txt as access control (it's public + advisory).
- Accidentally `Disallow: /` (de-indexes the whole site).

## CodeVault-specific Notes
- `/u/[username]` is SSR/ISR for SEO → keep indexable; `/app/*` is auth-gated → disallow + `noindex`.

## Future Considerations
- Per-environment robots (staging fully disallowed).

## Checklist
- [ ] `/robots.txt` served
- [ ] Public pages allowed; app/api disallowed
- [ ] Sitemap referenced
- [ ] Staging set to disallow all

## References
- [SITEMAP_XML.md](SITEMAP_XML.md) · [../docs/FRONTEND_PLAN.md](../docs/FRONTEND_PLAN.md)
- robotstxt.org · Google Search Central
