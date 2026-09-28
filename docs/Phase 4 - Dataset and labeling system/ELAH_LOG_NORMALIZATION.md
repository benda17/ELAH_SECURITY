# ELAH Log Conversion and Cleaning

| Field | Value |
|---|---|
| Document ID | ELAH-DATA-NORM-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 26 August 2026 |
| Related tasks | `task-4-convert-existing-simulator-logs-into-the-normali`, `task-4-clean-existing-logs`, `task-4-remove-duplicate-records`, `task-4-validate-timestamps-and-ordering`, `task-4-detect-incomplete-examples` |
| Depends on | `ELAH-SPEC-EVENT-001`, `ELAH-AGT-ENVELOPE-001`, `ELAH-AGT-QUALITY-001`, `ELAH-AGT-EXPORT-001`, `ELAH-SPEC-LABEL-TAXONOMY-001` |
| Code | `lib/elah/dataset/normalize.ts`, `scripts/normalize-elah-logs.ts` |
| Tests | `tests/elah/dataset-normalize.test.ts` |
| Output | `data/phase4/from-simulator.jsonl` (unlabeled) |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** This pipeline does **not** call `POST /v1/score`. Scores are **not** fields of `ElahEvent`. Converted rows are **unlabeled** — do not invent `intentLabel`. Do not invent ATM, `device_change`, or beneficiary-write action types.

---

## 1. Purpose

Convert live simulator operational logs into the **same** `ElahEvent` schemaVersion **1.0** used for scoring, then wrap quality-ok envelopes as unlabeled training-shaped JSONL for later labeling.

This is conversion and cleaning. It is not gold labeling, not a second envelope schema, and not a scoring run.

| What | Where |
|---|---|
| Live map `AuditLog` (+ `AgentEventLog` enrichment) → `ElahEvent` | Phase 2 `lib/elah/envelope.ts` (`listIngestibleEvents`, `mapAuditLogToElahEvent`) |
| Quality gate | Phase 2 `lib/elah/quality.ts` (`checkElahEvent`, `findDuplicateEventIds`) |
| Dataset drop reasons, PII lint, timestamp/sequence, gold completeness | `lib/elah/dataset/normalize.ts` (pure; no prisma, no `server-only`) |
| CLI | `scripts/normalize-elah-logs.ts` |

Do **not** fork the event schema. Downstream gold packs compile to the same envelope (`ELAH-SPEC-EVENT-001`).

---

## 2. Convert using the Phase 2 mapper

```
AuditLog  (+ AgentEventLog by eventId)
    → mapAuditLogToElahEvent          // Phase 2; do not copy this table here
    → checkElahEvent
    → Phase 4 clean (this document)
    → unlabeled JSONL  (labels: null)
```

| Rule | Behaviour |
|---|---|
| Mapper | Call `listIngestibleEvents`. Do not reimplement alias → canonical `actionType`. |
| Page views | Already excluded by the mapper (`*_view` / `*_viewed` / `*_opened` / `*_searched` are not ElahEvents). If one leaked, quality fails and the row is `dropped_quality`. |
| Lifecycle hops | `AgentEventLog` lines (`user_message_received`, `tool_call_requested`, `tool_call_executed`, …) are **not** scoring units. They are not gold rows. See `dropped_lifecycle`. |
| Labels | Converted rows get `labels: null` and `provenance.annotatorId: "unlabeled"`. **Do not invent gold `intentLabel`.** |
| Scoring | No `POST /v1/score`. No `elahScore` on the envelope. |

Unlabeled record shape (`datasetVersion: "from-simulator"`):

```json
{
  "schemaVersion": "1.0",
  "datasetVersion": "from-simulator",
  "pack": "simulator_export",
  "scenarioId": "<event.eventId>",
  "event": { "...ElahEvent 1.0..." },
  "labels": null,
  "provenance": {
    "source": "simulator_export",
    "generatorVersion": "normalize_v1",
    "taxonomyVersion": "1.0",
    "annotatorId": "unlabeled",
    "createdAt": "2026-08-26T00:00:00.000Z"
  }
}
```

`scenarioId` for this pack equals `event.eventId` (one scoring unit per converted line). Synthetic packs may use a scenario id distinct from `eventId`; UI vs agent twins MUST keep distinct `eventId`s.

---

## 3. Cleaning rules

Fail-closed: a row that matches a drop rule **does not** enter `from-simulator.jsonl` or a later gold cut. Cleaning **never** changes bank policy and **never** blocks a transfer.

| Drop reason | When | Applied to |
|---|---|---|
| `dropped_quality` | `quality.ok === false` from `checkElahEvent` (missing source/hash/session/conversation, unsanitized args, unknown/page-view `actionType`, extra top-level properties, …). See `ELAH-AGT-QUALITY-001`. | Simulator export and gold |
| `dropped_lifecycle` | `actionType` is an `AgentEventLog` hop (`user_message_received`, `tool_call_requested`, `tool_call_executed`, `policy_check_*`, `elah_scored`, …), not a scoring-unit envelope | Simulator export and gold |
| `dropped_timestamp` | `occurredAt` is not ISO-8601 UTC, or (gold/synthetic) the sequence is out of order | Simulator export and gold |
| `dropped_pii` | `piiLint` findings: forbidden keys, digit runs ≥ 8, emails outside the utterance/`annotatorId` exceptions below | Simulator export and gold |
| `dropped_duplicate` | Same `eventId` (and same `scenarioId` in packs) after the first kept occurrence (earliest `occurredAt`) | Simulator export and gold |
| `dropped_incomplete` | Gold completeness failure (`completenessGold`). **Not** applied to unlabeled `from-simulator.jsonl`. | Gold train/val/holdout only |

Utterance, if already present on the envelope, is capped at **2000** characters (same cap as Phase 2). Cleaning does not synthesize chat.

### 3.1 PII lint

Forbidden **keys** (presence fails, even nested): `userId`, `accountId`, `cardId`, `password`, `token`, `fromAccountId`, `toAccountId`.

Forbidden **values**:

| Pattern | Args (`action.args`) | `utterance` | `provenance.annotatorId` |
|---|---|---|---|
| Digit run of 8+ (PAN / account-number shaped) | Fail | Fail | Skipped (hash field) |
| Email, including `@elah.demo` | **Fail** | `@elah.demo` allowed for synthetic utterances only; other domains fail | Fail unless the value is a hex hash (16+). Raw emails, including `security.admin@elah.demo`, fail |

`actor.userIdHash` is required identity on the envelope; it is a hash, not `userId`. Do not commit live DB dumps.

---

## 4. Dedupe (`eventId` / `scenarioId`)

| Key | Simulator export | Synthetic / gold packs |
|---|---|---|
| `eventId` | Keep the **earliest** `occurredAt`. Later copies → `dropped_duplicate`. | Duplicate `eventId` cannot enter a cut `datasetVersion`. |
| `scenarioId` | Equals `eventId` in `from-simulator`. | Duplicate `scenarioId` cannot enter a cut `datasetVersion`. |

`findDuplicateKeys(ids)` returns the set of keys that appear more than once (same contract as `findDuplicateEventIds` on envelopes).

Lifecycle hops that **share** `eventId` with a scoring unit are correlation, not extra envelopes (`ELAH-AGT-QUALITY-001` §4). They must not be written as extra JSONL lines.

UI vs agent twins of the same banking act MUST keep distinct `eventId`s. They MAY share `twinGroupId` without being duplicates.

---

## 5. Timestamps and sequence order

| Check | Rule |
|---|---|
| `assertIsoTimestamp` | `occurredAt` MUST match ISO-8601 UTC (`YYYY-MM-DDTHH:mm:ss(.sss)?Z`) and parse as a real instant. |
| `assertSequenceOrder` | For rows sharing `sequenceId`: `stepIndex` is unique; `occurredAt` is **non-decreasing** as `stepIndex` increases. Invalid or inverted sequences are excluded (`dropped_timestamp`). |

Do not invent `device_change` timelines. Sequence is for agent tool chains and multi-step synthetic scenarios that already exist.

Converted simulator rows are typically one scoring unit (no `sequenceId`). Sequence validation is required when gold/synthetic packs attach `sequenceId` / `stepIndex`.

---

## 6. Incomplete gold vs unlabeled export

| File / split | `intentLabel` | Completeness |
|---|---|---|
| `data/phase4/from-simulator.jsonl` | **Must be null** | Envelope quality + clean rules only. `completenessGold` is **not** applied. |
| Gold train / val / holdout | Required, closed 22-value taxonomy | `completenessGold` must pass |

`completenessGold` reasons:

| Reason | When |
|---|---|
| `missing_intent_label` | No `labels.intentLabel` |
| `unknown_intent_label` | Label not in the allowed taxonomy |
| `missing_provenance` | `provenance` is not an object |
| `missing_event_id` / `missing_action_type` / `missing_source` | Required envelope fields absent |
| `missing_split` | Gold row has `split` set but it is not `train` \| `val` \| `holdout` |

Do **not** auto-impute labels. Unknown `intentLabel` is incomplete, not coerced.

Unlabeled converted logs may sit in `from-simulator.jsonl` for the labeling UI. They **cannot** enter train/val/holdout gold splits until a human (or signed synthetic generator) sets `intentLabel`.

---

## 7. Fail-closed ingest / fail-open banking

| Path | Behaviour |
|---|---|
| **Banking (fail-open)** | If ELAH is down, slow, or a row is dropped here, the simulator continues with **bank policy** only. Cleaning never freezes a transfer. |
| **Ingest / dataset (fail-closed)** | `quality.ok === false`, PII, duplicates, bad timestamps, lifecycle hops, and incomplete gold rows **do not** become scoring units or gold train rows. |

This is the same split as `ELAH-AGT-QUALITY-001`. Phase 4 adds named dataset drop reasons and a counts report; it does not change policy.

---

## 8. How to run

Requires `DATABASE_URL` (same as other simulator scripts). Preload stubs `server-only` so `lib/elah/envelope.ts` can be imported from `tsx`.

`--help` works **without** a database. If `DATABASE_URL` is unset or the database is unreachable, the script exits with a clear message and does not write a partial file.

```bash
# equivalent tsx invocation (works before the npm script exists)
npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/normalize-elah-logs.ts
npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/normalize-elah-logs.ts --limit=500
npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/normalize-elah-logs.ts --help

# after parent adds the npm script
npm run normalize:elah-logs
npm run normalize:elah-logs -- --limit=500
```

Writes `data/phase4/from-simulator.jsonl` (parent dirs created). Prints a counts report to **stdout** (`scanned`, `kept`, each drop reason, `byActionType`, `bySource`).

Pure functions are unit-tested without a database:

```bash
npx vitest run tests/elah/dataset-normalize.test.ts
```

`--limit=N` is the max **kept** unlabeled records after cleaning. Default **500**.

This script does not write `data/phase4/v1.0` packs (another agent).

---

## 9. Sign-off

I agree converted simulator logs reuse the Phase 2 `ElahEvent` mapper without a forked schema; that cleaning is fail-closed for ingest and fail-open for banking; that duplicates, timestamps, PII, lifecycle hops, and incomplete gold are named drop reasons; that `from-simulator.jsonl` stays unlabeled; and that this pipeline does not call `POST /v1/score` or invent `intentLabel`.

---

*End of document.*
