# ELAH Training / Event JSONL Export

| Field | Value |
|---|---|
| Document ID | ELAH-AGT-EXPORT-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-2-ensure-logs-can-be-exported-for-training` |
| Depends on | `ELAH-SPEC-EVENT-001`, `ELAH-SIM-ACTIONS-001`, Phase 2 envelope (`lib/elah/envelope.ts`) |
| Script | `scripts/export-elah-events.ts` |
| npm script | `export:elah-events` |

**Product freeze:** ELAH never allows, blocks, or executes. This export does **not** call `POST /v1/score`. It writes schemaVersion **1.0** `ElahEvent` lines for labeling and ingest rehearsal. It is **not** the Phase 4 label taxonomy freeze.

---

## 1. Purpose

A reproducible **JSONL** dump of mapped `ElahEvent` envelopes so Phase 4 annotators and later scoring work can consume the same shape the simulator will send.

This is **envelope export**, not training-event backfill.

| Script | What it does |
|---|---|
| `scripts/export-elah-events.ts` | JSONL of ingestible `ElahEvent` 1.0 envelopes |
| `scripts/backfill-elah-training.ts` | Fills `ElahTrainingEvent` rows from assistant turns (labeled context). **Do not replace it.** |

`ElahTrainingEvent` remains the assistant-turn training table. This exporter does not write that table and does not assign `intentLabel`.

---

## 2. How to run

Requires `DATABASE_URL` (same as other simulator scripts). Preload stubs `server-only` so the envelope module can be imported from `tsx`.

```bash
# stdout (default limit 500)
npm run export:elah-events

# cap after quality + dedup
npm run export:elah-events -- --limit=500

# write a file (parent dirs created)
npm run export:elah-events -- --limit=500 --out=./exports/elah-events.jsonl

# equivalent tsx invocation
npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/export-elah-events.ts --limit=100 --out=events.jsonl
```

JSONL goes to **stdout** or `--out=path`. A one-line summary (`source=envelope|fallback`, count, destination) goes to **stderr** so pipes stay clean.

```bash
npm run export:elah-events -- --limit=50 > /tmp/elah-events.jsonl
```

---

## 3. Export rules

| Rule | Behavior |
|---|---|
| Quality | Only envelopes with `quality.ok` (from `checkElahEvent` when the envelope module exists; otherwise a thin local check) |
| Page views | Excluded. `actionType` matching `/_(view\|viewed\|opened\|searched)$/` is not an `ElahEvent` (schema S8) |
| Duplicates | Same `eventId` → keep the row with the **earliest** `occurredAt` only. Lifecycle `AgentEventLog` hops that share an `eventId` are one scoring unit, not multiple export lines |
| Identity | `actor.userIdHash` only. No email, name, or raw `userId` / `actorId` |
| `--limit=N` | Max lines after quality + page-view skip + dedup. Default **500** |
| Format | JSONL: one `ElahEvent` per line. **Parquet is out of MVP** |

stderr reports which mapper ran:

- `source=envelope` — imported `listIngestibleEvents` / `checkElahEvent` from `@/lib/elah/envelope`
- `source=fallback` — thin `AuditLog` reader used because the envelope module was not present yet

---

## 4. Fields

When the envelope module is available, each line is a mapped `ElahEvent` schemaVersion **1.0** (see `ELAH-SPEC-EVENT-001`). Typical keys:

| Field | Notes |
|---|---|
| `schemaVersion` | Always `"1.0"` |
| `eventId` | Scoring-unit id (UUID/CUID). Dedup key |
| `occurredAt` | ISO-8601 UTC |
| `appId` | Simulator default `elah-banking-demo` |
| `source` | `ui` \| `agent` \| `system` |
| `actionType` | Canonical closed enum after mapping |
| `outcome` | Result at emit time |
| `actor.userIdHash` | SHA-256 hex prefix; never raw user id |
| `action.args` | Sanitized object (may be `{}`) |
| `conversation.utterance` | **Included only if already present on the envelope** (founder decision). Not synthesized |

Fallback lines (envelope module missing) are a **thin** subset:

```json
{
  "schemaVersion": "1.0",
  "eventId": "…",
  "occurredAt": "2026-08-25T12:00:00.000Z",
  "appId": "elah-banking-demo",
  "source": "ui",
  "actionType": "login",
  "outcome": "session",
  "actor": { "userIdHash": "…" },
  "action": { "args": {} }
}
```

Scores (`elahScore`, coordinates, explanations) are **not** fields of this export. They belong on the scoring response, not the event.

---

## 5. Redaction

Before a line is written:

1. Page-view audits are dropped (not mapped).
2. Identity keys are stripped if they appear: `email`, `name`, `actorName`, `userId`, `actorId`, `customerProfileId`, `profileId`, `rawUserId`.
3. `actor.userIdHash` is the only user identity on the line. Fallback hashes `AuditLog.actorId` with `hashUserId` when `userIdHash` is missing; rows with neither are skipped.
4. Fallback `action.args` is always `{}` so unsanitized `inputDataSummary` never leaves the bank through this path.
5. Envelope-module args must already pass `ELAH-SPEC-EVENT-001` §6 (forbidden keys, recipient redaction, long-string / digit-run rules). Quality failure → line omitted.

Do not treat this file as a license to put payee names, IBANs, passwords, or tokens into training dumps.

---

## 6. Not the Phase 4 label taxonomy freeze

This document does **not** freeze `ElahBankingIntent` labels, annotation guidelines, or gold-set policy.

- No `intentLabel` is assigned here.
- Optional `detectedIntent` on an envelope, if the mapper copied it, is a **simulator hint**, not ELAH’s label.
- Phase 4 taxonomy remains `docs/ELAH_LABEL_TAXONOMY.md` / `ELAH-SPEC-LABEL-TAXONOMY-001`.

Exporting envelopes unblocks labeling. It does not decide the label set.

---

## 7. Utterance (founder decision)

`conversation.utterance` is **included only when it is already present on the mapped envelope**. The exporter does not pull chat text from `AgentMessage` or `ElahTrainingEvent` on its own, and it does not strip an utterance the envelope module already attached.

Fallback AuditLog lines have no `conversation` object.

---

## 8. Format: JSONL, not Parquet

MVP format is **JSONL** (UTF-8, one JSON object per line, newline-terminated).

Parquet, Arrow, and other columnar dumps are **out of MVP**. A later phase may add them without changing `schemaVersion` `1.0` field names.

---

## 9. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | | | Approve / Approve with comments / Reject |
| Engineering | | | |

**Approval statement:** I agree that Phase 2 training export is JSONL of quality-ok `ElahEvent` 1.0 envelopes, excludes page views and duplicate `eventId`s, redacts email/name/raw user id, includes utterance only when already on the envelope, and is not the Phase 4 label taxonomy freeze.

---

*End of document.*
