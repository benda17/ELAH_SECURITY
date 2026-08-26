# ELAH Event Viewer (security-admin)

| Field | Value |
|---|---|
| Document ID | ELAH-AGT-VIEWER-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related tasks | live viewer, detail, filtering |
| Depends on | `ELAH-SPEC-EVENT-001`, Phase 1 ingest fields on `AuditLog` |
| Evidence | `app/(admin)/admin/elah-events/`, `lib/elah/envelope.ts`, `lib/elah/correlate.ts` |

---

## 1. Purpose

Give the **security reviewer** a live list and detail view of **ingestible ElahEvents** — the scoring-unit envelopes ELAH will later score. This is an observability surface inside the banking simulator. It does not call the scoring service and it does not change bank policy.

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are not fields of `ElahEvent` and are not shown in this viewer.

`/admin/assistant-logs` remains the **lifecycle** ops view (`user_message_received`, `tool_call_requested`, …). Do not delete it. One assistant turn may produce many lifecycle rows and **one** ElahEvent scoring unit.

---

## 2. How to open as `security.admin`

1. Seed or reset the simulator so canonical demo logins exist.
2. Open `/login`.
3. Sign in as **`security.admin@elah.demo`** / **`DemoPass123!`**.
4. After login the security portal lands on `/admin/security-dashboard`.
5. In the sidebar, open **ELAH events** (`/admin/elah-events`).

The admin layout and both viewer pages call `requireSecurity()`. Other roles are redirected (`/login?error=forbidden`) and an `unauthorized_route_access` audit is written. That audit is an **ops page-view-class row**, not an ElahEvent.

---

## 3. List — `/admin/elah-events`

Force-dynamic. Latest matching ingestible `AuditLog` rows, page views excluded (`*_view`, `*_viewed`, `*_opened`, `*_searched`).

Opening or filtering the list writes `elah_events_viewed`. That row is **ops**, not an ElahEvent.

### 3.1 Filters (GET `searchParams`)

| Param | Meaning |
|---|---|
| `source` | `ui` \| `agent` \| `system` |
| `actionType` | Canonical action (aliases such as `pay_bill` → `bill_payment` are included) |
| `toolName` | Assistant tool allow-list name |
| `outcome` | Canonical outcome (`posted` maps to `executed`, and so on) |
| `sessionId` | Exact session id |
| `q` | Substring match on `eventId` **or** `userIdHash` |
| `quality` | `ok` \| `fail` |
| `userIdHash` | Optional demo-user dropdown. **Submitted value is the hash**, never the email. Labels show customer name + role only. Hashing is `hashUserId` on the server. |

Empty / `all` means no constraint. Apply submits a GET form.

### 3.2 Table

Columns: time, actionType, source, customer said (utterance when `source=agent`), outcome, toolName, quality badge, short `eventId`. Each row links to `/admin/elah-events/[eventId]`. Empty state when nothing matches.

---

## 4. Detail — `/admin/elah-events/[eventId]`

- **This chat turn** — customer text and assistant reply. Website events have no chat.
- Planned tool, fallback vs language-model planner, bank policy.
- **Model explanation** and **result** (capped 500 chars, redacted) when captured.
- Quality **ruleIds** as badges.
- **Correlated hops** for the same turn (`turnId` / `messageId` / `eventId`).
- **Intent row** when `correlateTurn` returns a simulator intent (classifier hint, not an ELAH score).
- Full mapped envelope JSON (`JsonViewer`). No `elahScore`. Args are sanitized.
- Empty state if the id is missing or the row is a page view (not ingestible).

Opening a detail page writes `elah_event_opened` (ops, not an ElahEvent).

---

## 5. Mapper note (founder / engineering)

List and detail load envelopes via `listIngestibleEvents` in `lib/elah/envelope.ts`. Quality badges are `checkElahEvent` / `QualityResult` from `lib/elah/quality.ts` (already applied on each listed row). Correlated hops use `correlateTurn` from `lib/elah/correlate.ts`.

`lib/elah/admin-events.ts` is only a small helper: demo-user dropdown (server-side `hashUserId`, hash submitted — never email) and display sanitization (no scores, no passwords).

Page views and non-mappable ops rows are excluded by the envelope mapper (`mapAuditLogToElahEvent` returns null).

Quality `fail` is expected when conversation/session fields are missing on live agent rows (`missing_conversation`, `missing_session_id`).

---

## 6. What needs a founder walkthrough

Use this checklist in a live demo, not a screenshot:

1. Log in as `security.admin@elah.demo`. Confirm **ELAH events** is in the sidebar and `/admin/assistant-logs` is still there.
2. With no filters, confirm the list **omits** admin page views (`elah_events_viewed` itself must not appear as an ElahEvent).
3. Produce one customer UI action (e.g. transfer) and one assistant tool call. Both should appear, differing by `source`.
4. Filter by demo user (dropdown submits a hash). Confirm the URL has `userIdHash=` + hex, **not** an email.
5. Filter `quality=fail` and open a row. Read ruleIds. Confirm JSON has **no** `elahScore` and **no** password.
6. Open an assistant-sourced event that has conversation ids. Confirm hops + intent row. Confirm hops are lifecycle ops, not extra ElahEvents.
7. State out loud: **ELAH never allows, blocks, or executes.** This screen does not change the transfer.

---

## 7. Sign-off

I agree the security-admin ElahEvent viewer is list + detail + filters as specified; that page views and admin ops logs are not ElahEvents; that scores are not fields of the envelope; and that ELAH never allows, blocks, or executes.

---

## 8. Phase 3 score card

Detail (`/admin/elah-events/[eventId]`) now shows a separate **ELAH score (rules_v0)** card. It loads the latest `AgentEventLog` row for that `eventId` with `eventType` `elah_scored` or `elah_scoring_unavailable` and parses `metadata` JSON (`lib/elah/score-read.ts`).

| Snapshot | Card shows |
|---|---|
| `elah_scored` | `status` (scored \| abstained), `elahScore`, confidence, uncertainty, `intentLabel`, coordinates, explanation signals, `policyHook`, `requestId`, `scoredAt` |
| `elah_scoring_unavailable` | status unavailable + reason (`requestId`, HTTP/error when present) |
| No row | **Not scored (Phase 3 snapshot missing)** |

Copy on the card: this is **not** an allow / deny / execute. Bank policy remains the authority.

The list MAY show a compact scored / abstained / unavailable badge. **`envelopeForDisplay` still strips `elahScore`.** Customer UI and Jane’s `/assistant` do not show the score.

---

*End of document.*
