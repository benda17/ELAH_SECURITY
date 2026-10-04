# ELAH Training Record Schema

| Field | Value |
|---|---|
| Document ID | ELAH-DATA-TRAIN-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 26 August 2026 |
| Related tasks | `task-4-define-the-training-data-schema`, `task-4-track-data-provenance` |
| Depends on | `ELAH-SPEC-EVENT-001`, `ELAH-SPEC-OUTPUT-001`, `ELAH-SPEC-LABEL-TAXONOMY-001`, `lib/elah/types.ts` |
| Code | `lib/elah/dataset/schema.ts` |

**Product freeze (unchanged):** ELAH scores genuine banking intent before tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`.

---

## 1. Purpose

Freeze the labeled **training-record** schema that sits on top of `ElahEvent` 1.0. A gold row is envelope + labels + optional gold score + provenance + split tag.

This is **not**:

- a second event envelope
- a live `ScoreResponse`
- Prisma `ElahTrainingEvent` (live assistant-turn store; no Prisma change required)

File / JSONL is the Phase 4 source of truth.

---

## 2. Object model

```
ElahTrainingRecord
├── schemaVersion          "1.0"
├── datasetVersion         e.g. "v1.0"
├── split                  train | val | holdout | null
├── pack                   e.g. legitimate | malicious
├── scenarioId
├── sequenceId?            multi-step grouping
├── stepIndex?
├── twinGroupId?           UI vs agent twins of the same act
├── event                  TrainingEventPayload (ElahEvent 1.0 shape)
├── labels                 gold annotation
├── goldScore?             { elahScore, confidence } — sibling of event, never copied onto event
└── provenance             required
```

`lib/elah/envelope.ts` is `server-only`. Gold files use `TrainingEventPayload` in `schema.ts`, which mirrors ElahEvent 1.0 required fields without importing that module.

---

## 3. Field dictionary

### 3.1 Record header

| Field | Type | Req | Rules |
|---|---|---|---|
| `schemaVersion` | string | **yes** | `"1.0"` |
| `datasetVersion` | string | **yes** | Cut id, e.g. `v1.0` |
| `split` | string \| null | **yes** (nullable) | `train` \| `val` \| `holdout` \| `null` until split |
| `pack` | string | **yes** | Pack family name |
| `scenarioId` | string | **yes** | Stable id; unique within a cut |
| `sequenceId` | string \| null | no | All steps of a chain share this |
| `stepIndex` | number \| null | no | Unique within `sequenceId` |
| `twinGroupId` | string \| null | no | UI/agent twins share this; **distinct** `eventId`s |

### 3.2 `event`

Structural `ElahEvent` 1.0 (`ELAH-SPEC-EVENT-001`). Required header fields: `schemaVersion`, `eventId`, `occurredAt`, `appId`, `source`, `actionType`, `outcome`, `executionState`, `actor`, `action`. Simulator `appId` is `elah-banking-demo`. `source` is `ui` \| `agent` \| `system`.

**Must not appear on `event`:** `elahScore`, `confidence`, `uncertainty`, `coordinates`, `explanation`, `policyHook`, live `ScoreResponse` keys.

### 3.3 `labels`

| Field | Type | Req | Rules |
|---|---|---|---|
| `intentLabel` | `ElahBankingIntent` | **yes** | Closed 22; unknown values fail |
| `annotatorConfidence` | `high` \| `medium` \| `low` | **yes** | Human certainty of `intentLabel` |
| `annotatorConfidenceNumeric` | number | **yes** | `[0,1]`; bands in `ELAH-DATA-ANN-CONF-001` |
| `humanAgency` | number | **yes** | `[0,1]`, three decimals preferred |
| `financialRisk` | number | **yes** | `[0,1]` |
| `emotionalUrgency` | number | **yes** | `[0,1]` |
| `contextualRiskTags` | string[] | **yes** | Closed `CONTEXTUAL_RISK_TAGS`; may be `[]` |
| `matchedSignals` | string[] | **yes** | Signal ids, not raw chat |
| `weakSignals` | string[] | **yes** | |
| `negativeSignals` | string[] | **yes** | |
| `reviewNotes` | string | **yes** | May be `""`; required text for ambiguous/conflict packs |

Coordinates are gold labels for training. They are independent of `elahScore` (`ELAH-SPEC-COORDINATES-001` G9).

### 3.4 `goldScore` (optional)

| Field | Type | Req | Rules |
|---|---|---|---|
| `elahScore` | number | **yes** if object present | `[0,1]`. Higher = more genuine banking intent |
| `confidence` | number | **yes** if object present | Gold scorer-confidence, **not** annotator confidence |

Never copy `goldScore` onto `event`.

### 3.5 `provenance` (required)

| Field | Type | Req | Allowed |
|---|---|---|---|
| `source` | string | **yes** | `synthetic_generator` \| `simulator_export` \| `manual_label` |
| `generatorVersion` | string | **yes** | |
| `taxonomyVersion` | string | **yes** | `"1.0"` for this cut |
| `annotatorId` | string | **yes** | Opaque id; not a raw customer email |
| `createdAt` | string | **yes** | ISO-8601 UTC |

Missing provenance **fails** validation.

---

## 4. Example JSON

```json
{
  "schemaVersion": "1.0",
  "datasetVersion": "v1.0",
  "split": "train",
  "pack": "legitimate",
  "scenarioId": "legit-ext-transfer-001",
  "sequenceId": null,
  "stepIndex": null,
  "twinGroupId": "twin-ext-001",
  "event": {
    "schemaVersion": "1.0",
    "eventId": "evt_aaaaaaaaaaaaaaaaaaaaaaaa",
    "occurredAt": "2026-08-26T12:00:00.000Z",
    "appId": "elah-banking-demo",
    "source": "agent",
    "actionType": "external_transfer",
    "outcome": "pending_confirmation",
    "executionState": "pre_tool",
    "actor": {
      "userIdHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      "sessionId": "ses_bbbbbbbbbbbbbbbbbbbbbbbb",
      "actorType": "customer",
      "role": "premium_customer",
      "customerTier": "premium"
    },
    "action": {
      "toolName": "create_external_transfer",
      "page": "/assistant",
      "args": { "amount": 500, "recipientName": "[recipient_redacted]" },
      "amount": 500,
      "currency": "ILS",
      "amountBucket": "medium_500_1999",
      "accountContext": "checking",
      "recipientType": "saved_payee"
    },
    "policy": {
      "decision": "needs_confirmation",
      "reasons": ["tool 'create_external_transfer' requires explicit user confirmation"],
      "confirmationRequired": true
    },
    "conversation": {
      "conversationId": "cnv_cccccccccccccccccccccccc",
      "messageId": "msg_dddddddddddddddddddddddd",
      "utterance": "Send 500 ILS to my saved payee"
    },
    "mfaStatus": "unknown",
    "detectedIntent": "external_transfer"
  },
  "labels": {
    "intentLabel": "external_transfer",
    "annotatorConfidence": "high",
    "annotatorConfidenceNumeric": 0.9,
    "humanAgency": 0.82,
    "financialRisk": 0.78,
    "emotionalUrgency": 0.22,
    "contextualRiskTags": [],
    "matchedSignals": ["transfer_or_payment_verb", "amount_detected"],
    "weakSignals": [],
    "negativeSignals": [],
    "reviewNotes": "Genuine outbound transfer; bank confirmation still required."
  },
  "goldScore": {
    "elahScore": 0.87,
    "confidence": 0.82
  },
  "provenance": {
    "source": "synthetic_generator",
    "generatorVersion": "1.0",
    "taxonomyVersion": "1.0",
    "annotatorId": "synthetic",
    "createdAt": "2026-08-26T12:00:00.000Z"
  }
}
```

---

## 5. What is NOT on the record

| Forbidden on the gold row | Why |
|---|---|
| Live `ScoreResponse` (`requestId`, `status`, `scoredAt`, `policyHook`, `provenance.scorer`) | That is the HTTP scorer output (`ELAH-SPEC-OUTPUT-001`) |
| `elahScore` / `confidence` **on `event`** | Event schema S10; gold score is `goldScore` |
| Raw PII in `action.args` | Forbidden keys in `ELAH-SPEC-EVENT-001` §6 / `TRAINING_FORBIDDEN_ARG_KEYS` |
| Raw `userId`, email, IBAN, card number | Hash or omit |
| A 23rd `intentLabel` | Closed taxonomy |
| ATM / `device_change` / beneficiary-write product fields | Out of MVP |

Unlabeled simulator export lines may omit `labels` / `goldScore` in a **separate** file; they cannot enter train/val/holdout gold splits (`ELAH-DATA-NORM-001`).

---

## 6. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Data |  |  |  |
| Model |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree that Phase 4 gold training rows are `ElahTrainingRecord` 1.0 (`event` + `labels` + required `provenance` + optional `goldScore`); that `goldScore` is never copied onto `ElahEvent`; that `intentLabel` is the closed 22-value taxonomy; that Prisma `ElahTrainingEvent` is a different live store; and that ELAH still never allows, blocks, or executes.

---

*End of document.*
