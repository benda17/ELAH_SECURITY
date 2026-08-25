# ELAH Event Quality (ingest rules)

| Field | Value |
|---|---|
| Document ID | ELAH-AGT-QUALITY-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-2-create-a-normalized-event-envelope` (quality / duplicates / correlation) |
| Depends on | `ELAH-AGT-ENVELOPE-001`, `ELAH-SPEC-EVENT-001` |
| Alert channel (MVP) | **Founder / analyst dashboard** — not Slack |

---

## 1. Purpose

Decide which mapped `ElahEvent`s are **ingestible**. Banking continues on its own policy path. Ingest of a bad envelope does **not**.

**Product freeze:** ELAH never allow/block/execute. Quality failures do not change bank policy.

---

## 2. Fail-open banking / fail-closed ingest

| Path | Behaviour |
|---|---|
| **Banking (fail-open)** | If ELAH is down, slow, or has no score, the simulator continues with **bank policy** only. Do not freeze a transfer because ingest/quality failed. |
| **Ingest (fail-closed)** | An envelope with `quality.ok === false` is **not** a scoring unit. Dashboards may still list it as a defect. Export consumers MUST skip `ruleIds` failures. |

MVP alert channel for quality failures is the **dashboard** (ingest list + `ruleIds`). There is no Slack (or other chat) page in v1.

---

## 3. Quality rules (`ruleIds`)

Implemented by `checkElahEvent` in `lib/elah/quality.ts`. Result: `{ ok, eventId, ruleIds }`.

| `ruleId` | When |
|---|---|
| `missing_schema_version` | `schemaVersion` absent |
| `unknown_major_version` | Major ≠ `1` (e.g. `"2.0"`) |
| `extra_top_level_property` | Key not in the v1 envelope (`elahScore` is the canonical example) |
| `missing_source` | No `source` |
| `missing_user_id_hash` | No `actor.userIdHash` except `login_failed` |
| `missing_session_id` | No `actor.sessionId` except `login_failed` with no session |
| `missing_conversation` | `source = agent` without `conversation.conversationId` + `messageId` |
| `unknown_action_type` | Not in schema §5.1 |
| `page_view_not_event` | `*_view` / `*_viewed` / `*_opened` / `*_searched` (and `dashboard_view`) |
| `unsanitized_args` | Schema §6: forbidden keys, unredacted recipient/name, digit runs ≥ 8, overlong strings |
| `missing_policy_agent` | `source = agent` and `toolName != null` but no `policy` object |
| `duplicate_event_id` | Batch only — see §4 |

`ok` is true only when `ruleIds` is empty.

Schema samples 8.1–8.5 MUST pass. 8.6–8.9 MUST fail (at least one rule each).

---

## 4. Duplicates vs lifecycle hops sharing `eventId`

Two different meanings of “same id”:

| Case | Same `eventId`? | Duplicate for ingest? |
|---|---|---|
| Two **ingestible envelopes** (two `AuditLog` scoring units) | Yes | **Yes** — `findDuplicateEventIds` / `listIngestibleEvents` sets `duplicate_event_id` on the **later** row (`occurredAt`, then `auditLogId`). Export consumers **keep the earliest `occurredAt`**. |
| Several `AgentEventLog` **lifecycle hops** of one turn | Yes, by design (`runWithEventId`) | **No**. Hops are not ElahEvents. `correlateTurn` returns them as `hops[]` with the shared `eventId`. |

`findDuplicateEventIds(events)` looks only at ingestible `ElahEvent` arrays, not at agent hops.

---

## 5. Turn correlation

`correlateTurn({ conversationId, messageId })` loads:

- `AgentEventLog` hops for that turn, ordered by `metadata.sequence` then `timestamp`
- `AgentIntentEvent` for that `messageId` (latest)
- Utterance from `user_message_received` (capped 2000)
- Scoring-unit `eventId` from a tool/policy hop when present

This is observability for the dashboard. It is not a second envelope schema.

---

## 6. Public API

```ts
checkElahEvent(event) → QualityResult
findDuplicateEventIds(events) → Set<string>
correlateTurn({ conversationId, messageId })
listIngestibleEvents(filters) // quality.ok | fail filter after duplicate marking
```

---

## 7. Sign-off

I agree ingest is fail-closed on these rules, banking remains fail-open, the MVP alert channel is the dashboard, and shared hop `eventId`s are not duplicates of the scoring unit.

---

*End of document.*
