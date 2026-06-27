# 🧩 Browser Extension Store Listings

> CodeVault ships a cross-browser extension (**Path B v2**). Each store has its own developer account, review, and policy bar before the extension can be published.

| Field | Detail |
|-------|--------|
| **Overview** | Publishing the CodeVault WebExtension to Chrome Web Store, Firefox AMO, Microsoft Edge Add-ons, and the Apple App Store (Safari). |
| **Purpose** | Distribute the capture-at-source extension to users on every major browser. |
| **Category** | ⚪ Required only if the extension ships (the website + sync work without it). |
| **Why it is needed** | Users install from official stores; side-loading is not a real distribution channel. |
| **Legally required?** | No (each store's developer agreement applies). |
| **Technically required?** | Only to distribute the extension publicly. |
| **When to implement** | Milestone **E5** (after E0–E4: auth, capture, cross-browser, UX). |
| **Priority** | 🟡 Medium (gated behind the extension being built). |
| **Estimated Cost** | Chrome $5 one-time · Edge $0 · Firefox AMO $0 · Apple Developer **$99/yr** (Safari). |
| **Renewal** | Apple membership annual; others one-time/none. Re-review on each version. |
| **Official Website** | Chrome: chrome.google.com/webstore/devconsole · AMO: addons.mozilla.org · Edge: partner.microsoft.com · Apple: developer.apple.com |
| **Eligibility** | A developer account per store; policy-compliant, non-obfuscated build. |

## Step-by-Step Process
1. Register the developer account for each target store (Chrome, Edge, AMO, Apple).
2. Produce per-target bundles from the single MV3 source (WXT / CRXJS + Vite).
3. Prepare listing assets: icon set, screenshots, description, privacy policy URL, permission justifications.
4. Submit; respond to review feedback (permissions + data-use are the usual blockers).
5. For Safari, convert with `xcrun safari-web-extension-converter`, build in Xcode, submit via App Store Connect.

## Required Documents
- Public **privacy policy** URL (see [PRIVACY_POLICY](PRIVACY_POLICY.md)) and a clear data-use disclosure.
- Permission justification for each `host_permission` and API permission.
- Apple: Apple Developer Program enrollment.

## Implementation Guide
- One MV3 codebase + `webextension-polyfill`; emit Chromium, Firefox, and Safari builds.
- Keep `host_permissions` to the four platforms + the CodeVault API domain (reviewers reject over-broad scope).
- Ship **non-obfuscated** source maps where required (Chrome/AMO/Apple forbid obfuscated code).
- Version + changelog per release; staged rollout where supported.

## Best Practices
- Minimal permissions with in-listing justifications.
- Single-purpose listing (capture *your own* accepted solutions) — avoids "unclear purpose" rejections.
- Disclose exactly what data is captured (own accepted code + problem metadata) and where it goes (user's GitHub via git-service).

## Common Mistakes
- Over-broad `host_permissions` (`<all_urls>`) → automatic rejection.
- Missing/weak privacy disclosure for code capture.
- Obfuscated/minified-only bundles with no readable source.
- Forgetting Safari's annual Apple fee + separate Xcode build pipeline.

## CodeVault-specific Notes
- Gated behind milestone **E5**; the website + sync ship independently of stores.
- Security model in [../docs/EXTENSION_SECURITY.md](../docs/EXTENSION_SECURITY.md); architecture in [../docs/EXTENSION_PLAN.md](../docs/EXTENSION_PLAN.md).
- The extension signs in as the **same CodeVault user** — no separate account to disclose.

## Future Considerations
- Enterprise/self-hosted distribution (force-install policies) for orgs.
- Automated store publishing in CI once listings are established.

## Checklist
- [ ] Developer account per store (Chrome, Edge, AMO, Apple)
- [ ] Per-target bundles from one MV3 source
- [ ] Least-privilege permission justifications written
- [ ] Public privacy policy + data-use disclosure linked
- [ ] Non-obfuscated build with source maps
- [ ] Safari: Apple enrollment + Xcode conversion

## References
- [PRIVACY_POLICY.md](PRIVACY_POLICY.md) · [SECURITY_HEADERS.md](SECURITY_HEADERS.md) · [../docs/EXTENSION_SECURITY.md](../docs/EXTENSION_SECURITY.md) · [../docs/EXTENSION_PLAN.md](../docs/EXTENSION_PLAN.md)
- Chrome Web Store program policies · Firefox Add-on policies · Microsoft Edge Add-ons policies · Apple App Store Review Guidelines
