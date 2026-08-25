# ELAH Event Envelope (Phase 2 mapper)

| Field | Value |
|---|---|
| Document ID | ELAH-AGT-ENVELOPE-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-2-create-a-normalized-event-envelope` |
| Depends on | `ELAH-SPEC-EVENT-001`, `ELAH-SIM-ACTIONS-001` |
| Does not define | HTTP scoring (`POST /v1/score`), `ElahScore` fields, Prisma models |

---

## 1. Purpose

Map live simulator operational rows (`AuditLog`, with `AgentEventLog` enrichment) onto **one** `ElahEvent` schemaVersion **1.0** scoring unit.

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. This mapper does **not** call `POST /v1/score`.

---

## 2. Mapper location

| Piece | Module |
|---|---|
| Envelope type, mapper, validator, ingest list | `lib/elah/envelope.ts` |
| Public re-exports | `lib/elah/index.ts` |
| Canonical names | `docs/Phase 1 - Banking Simulator Stabilization/ELAH_ACTION_NAME_GLOSSARY.md` (§5) and schema §7.2 |
| Acceptance samples | `ELAH-SPEC-EVENT-001` §8.1–8.9 (`tests/events/fixtures/elah-event-samples.json`) |

```
AuditLog  (+ AgentEventLog by eventId)
    → mapAuditLogToElahEvent
    → ElahEvent 1.0
    → validateElahEvent / checkElahEvent
```

`listIngestibleEvents` queries recent `AuditLog`, drops unmapped rows (page views, manager ops, unknown types), enriches agent conversation/policy from matching `AgentEventLog.eventId`, then runs quality checks.

---

## 3. Versioning

| Rule | Behaviour |
|---|---|
| `schemaVersion` | `"1.0"` (`ELAH_EVENT_SCHEMA_VERSION`) |
| `appId` | `"elah-banking-demo"` (`ELAH_APP_ID`) |
| Unknown **major** (`2.x`, …) | Reject (`validateElahEvent`) / `unknown_major_version` (quality) |
| Later `1.x` additive fields | v1 consumers may ignore; v1 validator still uses `additionalProperties: false`, so extras fail quality (`extra_top_level_property`) until a schema bump |
| Required-field rename | Requires `2.0` |

`elahScore` and other output-contract fields MUST NOT appear on the envelope.

---

## 4. Scoring unit vs lifecycle

ELAH ingest uses **one envelope per scoring unit**, not one envelope per `AgentEventLog` line.

| Stream | What it is | `executionState` (this mapper) |
|---|---|---|
| Agent tool scoring unit | Planned P0/P1 tool (intent to act) | `pre_tool` |
| Agent refuse / no tool | Prompt injection or conversational refuse | `no_tool` |
| UI (website, no assistant) | Login, password reset, transfer form, downloads, profile | `no_tool` |

`post_tool` is reserved for a later training backfill. The Phase 0 scoring API rejects `post_tool`. Founder signed 25 Aug 2026: website = no chatbot involved; assistant tool = before the chatbot acted.

Lifecycle hops (`user_message_received`, `tool_call_requested`, `policy_check_passed`, …) stay on `AgentEventLog`. They MAY share `eventId` with the scoring unit. That is **correlation**, not a duplicate envelope (see `ELAH-AGT-QUALITY-001`).

Do not emit a separate `ElahEvent` for every hop of the same turn. `correlateTurn` reconstructs hops for analysts.

**v1 producer note:** dual-emit (pre-tool + post-tool) is out of scope (schema open item E2). One mapped envelope per ingestible `AuditLog` row.

---

## 5. Mapping table pointer

Canonical `actionType` is the schema §5.1 closed enum. Live aliases MUST map; they MUST NOT be copied onto the envelope.

**Authoritative alias table:** glossary §5 (Phase 1 wins if it diverges from schema §7.2 until schema 1.1).

Implemented in `ACTION_ALIAS_TO_CANONICAL` inside `lib/elah/envelope.ts`. Highlights:

| Live `AuditLog.actionType` | Canonical | Notes |
|---|---|---|
| `login` / `login_failed` / `logout` | same / `login_failed` / `logout` | Login success outcome is `session` (sample 8.5) |
| `password_reset_requested` | `password_reset` | Session |
| `transfer_submitted` | `external_transfer` **or** `internal_transfer` | UI path is external only. Agent uses tool: `create_internal_transfer` → internal |
| `transfer_blocked` | attempted type; **default `external_transfer`** | Outcome `blocked` |
| `*_view`, `*_viewed`, `*_opened`, `*_searched` | **do not map** | Returns `null` |
| `unauthorized_route_access`, manager `transfer_approved` / `loan_rejected`, … | **do not map** | MVP S9 / ops |

`action.toolName` is set only when `source = agent` **and** the live tool (or `ai_assistant.<tool>`) is on the schema §5.2 allow-list; otherwise `null`.

`source` comes from `AuditLog.source`, else `createdByAgent`.

`actor.userIdHash` comes from `AuditLog.userIdHash`, else `hashUserId(actorId)`. `login_failed` may omit it.

`action.args` is parsed `inputDataSummary` (the nested `elah` context object is stripped) then `sanitizeToolArgs` (`lib/elah/helpers.ts`) plus remaining schema §6 rules.

`conversation` is required for `source = agent`: filled from `AgentEventLog` rows sharing `eventId` (`conversationId`, `messageId`, `userMessage` capped at 2000).

---

## 6. Public API

```ts
ELAH_EVENT_SCHEMA_VERSION
ELAH_APP_ID
mapAuditLogToElahEvent(row) // ElahEvent | null
validateElahEvent(event)    // { ok, errors }
listIngestibleEvents(filters)
```

`validateElahEvent` MUST accept schema samples 8.1–8.5 and reject 8.6–8.9.

---

## 7. Sign-off

I agree this mapper produces `ElahEvent` 1.0 for ingest, that scores are not event fields, and that ELAH never allow/block/execute.

---

*End of document.*
