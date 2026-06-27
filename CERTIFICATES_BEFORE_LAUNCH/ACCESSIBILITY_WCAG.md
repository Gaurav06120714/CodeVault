# ♿ Accessibility (WCAG 2.1 AA)

> CodeVault's UI should meet WCAG 2.1 AA — both ethically and to reduce legal risk (ADA/EAA) and widen reach.

| Field | Detail |
|-------|--------|
| **Overview** | Conformance of the Next.js frontend to Web Content Accessibility Guidelines 2.1 Level AA. |
| **Purpose** | Usable by people with disabilities; legal risk reduction; better UX for all. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | Public-facing app; accessibility lawsuits target inaccessible sites; EAA (EU) applies from 2025. |
| **Legally required?** | Increasingly (ADA case law US, EAA EU) for consumer products. |
| **Technically required?** | No, but design-system + a11y states are part of FRONTEND_PLAN DoD. |
| **When to implement** | During frontend build; verified before launch. |
| **Priority** | 🟠 High |
| **Estimated Cost** | $0 (tooling) + dev time; audits paid. |
| **Renewal** | Re-test each release; periodic audit. |
| **Official Website** | https://www.w3.org/WAI/WCAG21/quickref/ |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. Build with semantic HTML + ARIA where needed; AA color contrast (tokens already chosen).
2. Keyboard nav + focus traps for drawer/dialogs; `aria-live` for toasts/sync status.
3. Automated checks (axe) in CI + manual keyboard/screen-reader passes on all 15 pages.

## Required Documents
- (Optional) VPAT/Accessibility Conformance Report for enterprise buyers.

## Implementation Guide
- See [../docs/FRONTEND_PLAN.md](../docs/FRONTEND_PLAN.md) §9 (UX) + §16 (QA): skeletons, empty/error states, `aria-current`, reduced-motion.

## Best Practices
- Test with real screen readers (VoiceOver/NVDA); honor `prefers-reduced-motion`; contrast AA on the coral/gold/rose palette.

## Common Mistakes
- Icon-only buttons without labels; non-keyboard-operable menus; low-contrast text on paper bg.

## CodeVault-specific Notes
- Data-viz (rings/heatmap) need text alternatives; platform badges keep brand colors but must still pass contrast for text.

## Future Considerations
- VPAT for enterprise; automated a11y regression gates.

## Checklist
- [ ] Semantic HTML + ARIA; AA contrast
- [ ] Keyboard nav + focus management (drawer/dialogs)
- [ ] `aria-live` for dynamic regions
- [ ] axe in CI; manual SR pass on all pages
- [ ] reduced-motion honored

## References
- [../docs/FRONTEND_PLAN.md](../docs/FRONTEND_PLAN.md) · [../docs/TESTING_PLAN.md](../docs/TESTING_PLAN.md)
- W3C WAI · WebAIM
