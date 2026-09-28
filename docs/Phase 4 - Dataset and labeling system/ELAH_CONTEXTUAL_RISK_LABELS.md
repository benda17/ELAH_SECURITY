# ELAH Contextual Risk Labels

| Field | Value |
|---|---|
| Document ID | ELAH-DATA-CTX-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 26 August 2026 |
| Related tasks | `task-4-define-contextual-risk-labels` |
| Depends on | `ELAH-SPEC-EVENT-001` (S6 client context), `ELAH-DATA-TRAIN-001` |
| Code | `CONTEXTUAL_RISK_TAGS` in `lib/elah/dataset/schema.ts` |

**Product freeze (unchanged):** ELAH scores genuine banking intent before tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Tags are **not** intent labels and **not** product events. Do not add `device_change`, ATM, or beneficiary-write actions. Jane / customer UI MUST NOT show `elahScore` or these tags.

---

## 1. Closed tag list

`labels.contextualRiskTags` is a string array. Unknown tags fail validation. Tags may be empty. A high-value genuine transfer can be tagged `high_value` **and** still labeled `external_transfer` with high `humanAgency`.

| Tag | Meaning |
|---|---|
| `high_value` | Amount in a large / very-large bucket, or near/over tier cap |
| `unusual_device` | `client.userAgent` atypical for this synthetic actor |
| `unusual_location` | `client.ipAddress` atypical (synthetic / documentation-range IPs only) |
| `behavior_drift` | Short history sketch then a drifted action (e.g. quiet reader → large send) |
| `accidental_error` | Honest mistake; see `ELAH-DATA-DIM-001` §3 |
| `excessive_permission` | Planned tool beyond tier/role (Jane requesting VIP export) |
| `authz_boundary` | Cross-customer or wrong-role tool plan |
| `exfiltration` | Bulk / dump / “all VIP data”; **not** own monthly statement after confirm |
| `first_payee` | First-time payee **class** (no beneficiary-write product) |
| `unusual_amount` | Amount odd vs the actor’s sketched norm; still a real banking intent |
| `odd_hours` | Occurred-at outside ordinary hours (synthetic clock) |
| `conflict` | Contradictory instructions; tie-break in `reviewNotes` |
| `tool_result_untrusted` | Synthetic tainted tool result; do not sabotage live `executeTool` |

---

## 2. Unusual device and location

Phase 0 S6: no device inventory. Client context is optional `ipAddress` + `userAgent` only.

| Tag | Envelope field | Must not |
|---|---|---|
| `unusual_device` | `event.client.userAgent` | `actionType: device_change`; device manager UI |
| `unusual_location` | `event.client.ipAddress` | GPS collection; live geo-fencing product |

`actionType` stays a real banking action (`external_transfer`, `balance` read, etc.). Context is synthetic on gold rows. No real customer IPs.

---

## 3. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Data |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree that contextual risk is a closed tag list on gold labels, not a 23rd intent and not a new product surface; that unusual device/location use only `client.userAgent` / `client.ipAddress`; and that tags do not authorize ELAH to allow, block, or execute.

---

*End of document.*
