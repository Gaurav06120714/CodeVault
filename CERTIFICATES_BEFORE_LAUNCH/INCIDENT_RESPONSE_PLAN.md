# 🚨 Incident Response Plan (IRP)

> A pre-written playbook for detecting, containing, and recovering from security incidents — critical because CodeVault stores third-party tokens.

| Field | Detail |
|-------|--------|
| **Overview** | Documented roles, steps, and comms for handling incidents (breach, outage, abuse). |
| **Purpose** | Respond fast + consistently; meet breach-notification deadlines. |
| **Category** | ⭐ Strongly Recommended Before Launch |
| **Why it is needed** | A token-store breach is high-impact; ad-hoc response loses critical time. |
| **Legally required?** | GDPR requires breach notification within **72h**; an IRP operationalizes it. |
| **Technically required?** | No (process). |
| **When to implement** | Before launch (at least a lightweight version). |
| **Priority** | 🟠 High |
| **Estimated Cost** | $0 (process) + on-call tooling. |
| **Renewal** | Tabletop exercise quarterly/annually. |
| **Official Website** | https://www.nist.gov/ (SP 800-61) |
| **Eligibility** | N/A. |

## Step-by-Step Process
1. **Detect** — alerts (5xx, auth-fail, token-decrypt failures) page on-call.
2. **Triage** — severity (Sev1 data/auth, Sev2 degraded, Sev3 minor).
3. **Contain** — kill switch `SYNC_ENABLED=false`; rotate KMS; revoke sessions.
4. **Eradicate** — patch; force re-OAuth; invalidate tokens.
5. **Notify** — users + regulators (GDPR 72h if PII).
6. **Recover** — restore from clean backup; verify.
7. **Postmortem** — blameless RCA within 48h.

## Required Documents
- Runbooks per top incident; on-call roster; contact tree.

## Implementation Guide
- Pre-write runbooks: token-store breach, GitHub-token abuse, auth outage, queue dead, dependency CVE (see [../docs/OBSERVABILITY_PLAN.md](../docs/OBSERVABILITY_PLAN.md) §6).

## Best Practices
- Single incident commander; status-page updates; preserve evidence; rehearse.

## Common Mistakes
- No kill switch; no comms plan; missing the 72h GDPR clock; no postmortems.

## CodeVault-specific Notes
- **Token-store breach runbook:** pause sync → rotate KMS → invalidate refresh tokens → audit `audit_logs` → notify users to re-authorize platforms → GDPR notify if EU PII.

## Future Considerations
- 24/7 on-call; SIEM; automated containment.

## Checklist
- [ ] Severity definitions + on-call roster
- [ ] Runbooks for top 5 incidents
- [ ] Kill switch tested
- [ ] Breach-notification process (72h)
- [ ] Postmortem template + tabletop drills

## References
- [DISASTER_RECOVERY_PLAN.md](DISASTER_RECOVERY_PLAN.md) · [SECURITY_MONITORING.md](SECURITY_MONITORING.md) · [../docs/OBSERVABILITY_PLAN.md](../docs/OBSERVABILITY_PLAN.md) · [../docs/SECURITY_PLAN.md](../docs/SECURITY_PLAN.md) §20.5
- NIST SP 800-61
