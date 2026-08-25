# ELAH Threshold Configuration Model

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-THRESHOLDS-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-threshold-configuration-model` |

---

## 1. Purpose

Thresholds turn scores into **operational attention** for a tenant. They are **not** ELAH enforcement. The bank may later subscribe `policyHook` + bands to *its* engine.

---

## 2. Config object (v1)

```json
{
  "tenantId": "elah-banking-demo",
  "environment": "demo",
  "version": "1.0",
  "elahNeverEnforces": true,
  "defaults": {
    "abstainBelowConfidence": 0.40,
    "genuineAboveScore": 0.75,
    "offIntentBelowScore": 0.40,
    "watchFinancialRiskAtOrAbove": 0.70
  },
  "overrides": [
    {
      "actionClass": "external_transfer",
      "watchFinancialRiskAtOrAbove": 0.60
    }
  ]
}
```

| Field | Meaning |
|---|---|
| `abstainBelowConfidence` | Producer SHOULD set `status: abstained` (confidence spec C7) |
| `genuineAboveScore` / `offIntentBelowScore` | UI bands (score semantics) |
| `watchFinancialRiskAtOrAbove` | `policyHook: watch` on scored P0 money tools |
| `overrides[].actionClass` | Canonical `actionType` / intent |

---

## 3. Override rules

1. `elahNeverEnforces` is constant `true` in MVP.
2. Unknown actionClass → defaults.
3. Environment `demo` | `staging` | `pilot`. No production-bank env in MVP.
4. Changing cuts does **not** require an output-contract version bump; changing field names does.
5. Analyst UI reads config for **labels**, not to hide events.

---

## 4. Defaults for `elah-banking-demo`

Match published samples: abstain 0.40, genuine 0.75, off-intent 0.40, watch FR 0.70.

---

## 5. Sign-off

I agree thresholds are tenant display/attention config and never allow/block inside ELAH.

---

*End of document.*
