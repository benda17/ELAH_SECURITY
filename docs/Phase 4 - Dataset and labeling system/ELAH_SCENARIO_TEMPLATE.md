# ELAH Scenario Template

| Field | Value |
|---|---|
| Document ID | ELAH-DATA-TPL-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 26 August 2026 |
| Related tasks | `task-4-create-a-scenario-template-format` |
| Depends on | `ELAH-DATA-TRAIN-001`, `ELAH-SPEC-EVENT-001` |
| Code | `lib/elah/dataset/template.ts` (`ElahScenarioTemplate`, `compileScenarioToTrainingRecord`) |

**Product freeze (unchanged):** ELAH scores genuine banking intent before tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Templates compile to gold rows; they do not call `POST /v1/score` and do not execute tools. Jane / customer UI MUST NOT show `elahScore`.

Utterance is allowed on **synthetic** gold rows. Live scoring envelopes must not add raw chat that the event schema / privacy rules forbid (`ELAH-DATA-PRIV-001`).

---

## 1. Template fields

| Field | Req | Notes |
|---|---|---|
| `id` | **yes** | Becomes `scenarioId`. Also hashed to `event.eventId` |
| `pack` | **yes** | Pack family |
| `actorTier` | **yes** | `basic` \| `premium` \| `vip` (Jane / premium / Isabella) |
| `channel` | **yes** | `ui` \| `agent` → `event.source`. UI forces `toolName: null` |
| `utterance` | no | Synthetic user text; agent channel only on the envelope |
| `plannedTool` | no | Allow-listed tool when `channel = agent` |
| `expectedActionType` | **yes** | Canonical `actionType` (no ATM / `device_change`) |
| `expectedIntentLabel` | **yes** | Closed 22 |
| `expectedOutcome` | **yes** | Envelope `outcome` |
| `executionState` | no | Default `pre_tool` (agent+tool) or `no_tool` |
| `policy` | no | Bank policy snapshot; not an ELAH decision |
| `coordinates` | **yes** | `{ humanAgency, financialRisk, emotionalUrgency }` |
| `tags` | no | Closed contextual tags |
| `sequenceId` / `stepIndex` | no | Multi-step chains |
| `twinGroupId` | no | UI vs agent twins; distinct `eventId`s |
| `args` | no | Sanitized on compile (forbidden keys stripped; recipient strings redacted) |
| `amount` / `currency` / buckets | no | Amount bucket inferred from amount if omitted |
| `annotatorConfidence` (+ numeric) | no | Default high / 0.90 |
| `reviewNotes` | no | Required by guidelines for ambiguous/conflict |
| `goldScore` | no | Optional; never copied onto `event` |
| `datasetVersion` / `split` | no | Defaults `v1.0` / `null` |

Compile: `compileScenarioToTrainingRecord(template, overrides) → ElahTrainingRecord`.

Deterministic:

- `event.eventId` = SHA-256 of `elah.scenario:{id}`, prefixed `evt_`
- `actor.userIdHash` = 32 hex SHA-256 of `elah.synthetic.actor:{id}` (fake; not a live customer hash)
- `appId` = `elah-banking-demo`
- `schemaVersion` = `1.0` on record and event

---

## 2. Filled example (legitimate external transfer, agent)

```json
{
  "id": "legit-ext-transfer-001",
  "pack": "legitimate",
  "actorTier": "premium",
  "channel": "agent",
  "utterance": "Send 500 ILS to my saved payee",
  "plannedTool": "create_external_transfer",
  "expectedActionType": "external_transfer",
  "expectedIntentLabel": "external_transfer",
  "expectedOutcome": "pending_confirmation",
  "policy": {
    "decision": "needs_confirmation",
    "reasons": ["tool 'create_external_transfer' requires explicit user confirmation"],
    "confirmationRequired": true
  },
  "coordinates": {
    "humanAgency": 0.82,
    "financialRisk": 0.78,
    "emotionalUrgency": 0.22
  },
  "tags": [],
  "args": { "amount": 500, "recipientName": "Daniel" },
  "amount": 500,
  "recipientType": "saved_payee",
  "annotatorConfidence": "high",
  "annotatorConfidenceNumeric": 0.9,
  "matchedSignals": ["transfer_or_payment_verb", "amount_detected"],
  "reviewNotes": "Genuine outbound transfer; bank confirmation still required.",
  "goldScore": { "elahScore": 0.87, "confidence": 0.82 }
}
```

After compile, `action.args.recipientName` is `[recipient_redacted]`. `source` is `agent`. UI twin of the same act uses `channel: "ui"`, `twinGroupId` shared, new `id` (new `eventId`).

Phase 1 `scripts/phase1-scenarios.json` is a **live-hook** demo format, not this gold template.

---

## 3. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Data |  |  |  |

**Approval statement:** I agree that every Phase 4 synthetic scenario uses this template; that compile produces ElahEvent 1.0 + gold labels with deterministic `eventId`, sanitized args, fake 32-hex `userIdHash`, and `appId` `elah-banking-demo`; and that compiling a template does not allow, block, or execute.

---

*End of document.*
