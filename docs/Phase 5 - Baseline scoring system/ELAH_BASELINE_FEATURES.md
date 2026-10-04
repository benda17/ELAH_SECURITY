# ELAH Baseline Features

| Field | Value |
|---|---|
| Document ID | ELAH-BASE-FEAT-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-5-define-baseline-risk-features`, `task-5-define-behavioral-features`, `task-5-define-agent-behavior-features`, `task-5-define-banking-context-features`, `task-5-define-action-chain-features`, `task-5-implement-feature-extraction` |
| Depends on | `ELAH-SPEC-EVENT-001`, `ELAH-BASE-RULES-001`, `ELAH-DATA-CTX-001` |
| Code | `lib/elah/baseline/` (feature extract); envelope `lib/elah/envelope.ts`; gold tags `lib/elah/dataset/schema.ts` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

---

## 1. Purpose

Freeze the **five feature families** the Phase 5 baseline may read from **one** `ElahEvent` 1.0.

Extraction is `lib/elah/baseline/` (e.g. `features.ts`). Features are **inputs to rules**. They are not API fields, not gold labels, and not a 23rd intent. Downstream `ScoreResponse` still contains only the Phase 0 output-contract object.

---

## 2. Extraction rule

```
one ElahEvent  →  BaselineFeatures  →  rules_v0 ElahScore
```

| May read | Must not read |
|---|---|
| Fields on this event’s envelope (`ELAH-SPEC-EVENT-001`) | Other events, `AuditLog` history, `AgentEventLog` hops as a time series |
| Closed enums already on the envelope | Live customer profile store, device inventory, geo database |
| Cheap utterance **lexicon** flags (boolean / counts) | Raw utterance copied into explanation or reason codes |
| Gold **contextual tags** only when evaluating labeled JSONL | Treating `unusual_device` / `unusual_location` as required live envelope fields |

Unknown extra keys on the live envelope are already rejected at ingest. Features MUST NOT invent ATM, beneficiary-write, or `device_change` fields.

---

## 3. Family A — Risk

Harm **if the requested tool ran**, not “this customer is a fraudster”. High FR on a genuine wire is expected (`ELAH-SPEC-COORDINATES-001` G9).

| Name | Type | Source on `ElahEvent` | Allowed values |
|---|---|---|---|
| `amount_bucket` | enum | `action.amountBucket` | `none` \| `micro_1_99` \| `small_100_499` \| `medium_500_1999` \| `large_2000_9999` \| `very_large_10000_plus` |
| `amount_present` | boolean | `action.amount` | `true` if finite `amount > 0`; else `false` |
| `currency` | enum \| null | `action.currency` | `ILS` \| `null` |
| `high_value_bucket` | boolean | derived from `amount_bucket` | `true` iff `large_2000_9999` or `very_large_10000_plus` |
| `harm_class` | enum | `action.toolName` + `actionType` | `money_move` \| `entitlement` \| `document_export` \| `read` \| `support` \| `session` \| `injection` \| `other` |
| `p0_money_move` | boolean | `harm_class` + intent map | `true` for internal/external transfer, bill pay, scheduled payment (tools: `create_internal_transfer`, `create_external_transfer`, `pay_bill`) |
| `p0_entitlement` | boolean | tool / `actionType` | `true` for `freeze_card` / `unfreeze_card` / `card_freeze` / `card_unfreeze` |
| `policy_decision` | enum | `policy.decision` (or omit → `not_applicable`) | `allow` \| `deny` \| `needs_confirmation` \| `not_applicable` |
| `confirmation_required` | boolean | `policy.confirmationRequired` | `true` \| `false` (false if policy omitted) |
| `outcome` | enum | `outcome` | `executed` \| `blocked` \| `cancelled` \| `failed` \| `pending_confirmation` \| `conversational` \| `refused` \| `session` |
| `mfa_status` | enum \| omitted | `mfaStatus` | `unknown` \| `not_enabled` \| `passed` \| `failed` \| `skipped` \| omitted |
| `policy_injection_reason` | boolean | `policy.reasons[]` | `true` if any reason matches injection / ignore-previous / policy-bypass / jailbreak |

`harm_class = money_move` does **not** lower `elahScore` on a genuine send. It raises **financialRisk**.

---

## 4. Family B — Behavioral

Signals about **this request’s wording and actor**, not a learned customer baseline.

| Name | Type | Source on `ElahEvent` | Allowed values |
|---|---|---|---|
| `source` | enum | `source` | `ui` \| `agent` \| `system` |
| `actor_type` | enum | `actor.actorType` | `customer` \| `manager` \| `admin` \| `ai_agent` \| `anonymous` |
| `customer_tier` | enum \| null | `actor.customerTier` | `basic` \| `premium` \| `vip` \| `not_applicable` \| `null` |
| `role` | string \| null | `actor.role` | Live roles (`regular_customer`, `premium_customer`, `vip_customer`, `bank_manager`, `security_reviewer`, `ai_agent`) or `null` |
| `utterance_present` | boolean | `conversation.utterance` | `true` if non-empty string |
| `utterance_length` | integer | `conversation.utterance` | `0` if omitted; else UTF-8 length capped at envelope cap (2000) |
| `utterance_short` | boolean | `utterance_length` | `true` if length `> 0` and `< 24` |
| `payment_verb` | boolean | utterance lexicon | `true` if transfer / send / pay / wire (case-insensitive); `false` if no utterance |
| `injection_lexicon` | boolean | utterance lexicon | `true` on ignore-previous / override-policy / jailbreak-style tokens; **not** an exploit payload |
| `pressure_lexicon` | boolean | utterance lexicon | `true` on hurry / emergency / now-or-lost-card style pressure |
| `detected_intent` | enum \| null | `detectedIntent` | one of 22 `ElahBankingIntent` or `null` |
| `occurred_hour_utc` | integer 0–23 | `occurredAt` | hour of this event’s clock only |
| `odd_hours_clock` | boolean | `occurred_hour_utc` | `true` if hour `< 6` or `≥ 23` (synthetic / demo clock; not a geo product) |

Lexicon flags are **booleans**. Do not store the matched substring. Do not copy the utterance into `explanation.summary`.

`odd_hours_clock` is **not** the gold tag `odd_hours`. The gold tag may be set by annotators; the live feature is a clock bit on this event only.

---

## 5. Family C — Agent behavior

How the **assistant path** looks on this scoring unit. UI events simply leave tool fields null.

| Name | Type | Source on `ElahEvent` | Allowed values |
|---|---|---|---|
| `tool_name` | enum \| null | `action.toolName` | one of 13 allow-listed tools (`ELAH_TOOL_NAMES`) or `null` |
| `tool_in_allowlist` | boolean | `action.toolName` | `true` if non-null and in the 13; `false` if null; unknown names are ingest-invalid |
| `tool_category` | enum | `tool_name` | `read` \| `money_move` \| `card_control` \| `document_export` \| `support` \| `none` |
| `args_key_count` | integer | `action.args` | count of sanitized keys (`{}` → 0) |
| `conversation_bound` | boolean | `conversation` | `true` when `source = agent` and conversation object present |
| `page` | string \| null | `action.page` | route if known (`/assistant`, `/transfer`, `/login`) or `null` |
| `intent_tool_mismatch` | boolean | `detectedIntent` vs tool map | `true` when both present and they disagree on money-move vs read vs injection |
| `no_tool_conversational` | boolean | `executionState` + `tool_name` | `true` if `no_tool` or (`tool_name` null and outcome `conversational` / `refused`) |

There is **no 14th tool**. Unknown `toolName` is not a feature value; it is a validation failure. Do not add ATM or `device_change` tools here.

---

## 6. Family D — Banking context

What kind of **banking act** this envelope describes.

| Name | Type | Source on `ElahEvent` | Allowed values |
|---|---|---|---|
| `action_type` | enum | `actionType` | closed `ELAH_ACTION_TYPES` (`lib/elah/envelope.ts`) |
| `account_context` | enum | `action.accountContext` | `checking` \| `savings` \| `investment` \| `checking_and_savings` \| `all` \| `unspecified` |
| `recipient_type` | enum | `action.recipientType` | `none` \| `self` \| `utility` \| `person_name` \| `business` \| `saved_payee` |
| `app_id` | string | `appId` | Simulator default `elah-banking-demo` |
| `execution_state` | enum | `executionState` | `pre_tool` \| `post_tool` \| `no_tool` |
| `schema_version` | string | `schemaVersion` | `"1.0"` (reject otherwise at ingest; not a learned feature) |
| `user_id_hash_present` | boolean | `actor.userIdHash` | `false` only expected on anonymous `login_failed` |
| `session_id_present` | boolean | `actor.sessionId` | `true` if non-null |

`recipient_type = person_name` / `saved_payee` is **payee class**, not a beneficiary-write product. There is no `first_payee` live store; gold tag `first_payee` is annotation-only (`ELAH-DATA-CTX-001`).

---

## 7. Family E — Action chain

From **one** event the baseline can only see **this step’s pipeline position**, not the rest of the chain.

| Name | Type | Source on `ElahEvent` | Allowed values |
|---|---|---|---|
| `execution_state` | enum | `executionState` | `pre_tool` \| `post_tool` \| `no_tool` (MVP scoring unit is `pre_tool`) |
| `outcome` | enum | `outcome` | same as family A |
| `pending_confirmation` | boolean | `outcome` | `true` iff `pending_confirmation` |
| `policy_already_denied` | boolean | `policy.decision` + `outcome` | `true` if `deny` or outcome `blocked` / `refused` |
| `channel` | enum | `source` | `ui` \| `agent` \| `system` |
| `has_conversation_ids` | boolean | `conversation.conversationId` + `messageId` | `true` when both present |

Gold JSONL may carry `sequenceId` / `stepIndex` / `twinGroupId` on the **training record**, not on `ElahEvent`. Live `POST /v1/score` MUST NOT require those keys. Eval MAY join them for reporting (twin independence — see limitations) but MUST score each envelope alone.

---

## 8. What CANNOT be extracted from one event

The baseline MUST NOT pretend these exist:

| Missing signal | Why it is missing | Do not invent |
|---|---|---|
| **Velocity** | No prior-event counts, no rolling windows | `transfers_last_hour`, `amount_24h` |
| **Retry loops** | No “same tool failed N times” on the envelope | `retry_count`, `confirm_spam` |
| **Session windows** | `sessionId` is an id, not a timeline | session duration, hop count, previous tool |
| **Live human profile** | Envelope has `userIdHash` + optional tier only; no spend graph | “unusual for Jane”, device inventory, home location |
| **Multi-step history** | One scoring unit | previous `ElahEvent` in `sequenceId` |
| **UI/agent twin of the same act** | Twins are **two events** with distinct `eventId`s | scoring them as one object |
| **Live κ / annotator notes** | Gold-only | feeding `reviewNotes` into the scorer |

Correlated hops on `/admin/elah-events/[eventId]` are **operational** (`AgentEventLog`). They are not baseline features.

---

## 9. Unusual device / location (gold tags, not required live fields)

Phase 0 S6: no device inventory. Client context is **optional** `client.ipAddress` + `client.userAgent` only.

| Gold tag (`labels.contextualRiskTags`) | Envelope field if present | Required on live `POST /v1/score`? |
|---|---|---|
| `unusual_device` | `client.userAgent` | **No.** Entire `client` object MAY be omitted. |
| `unusual_location` | `client.ipAddress` | **No.** |

| Must not |
|---|
| `actionType: device_change` |
| Device-manager UI, fingerprint, push token, GPS product |
| Treating missing `client` as hostility |
| Using real customer IPs in gold or fixtures |

If `client` **is** present, extractors MAY record:

| Name | Type | Source | Allowed values |
|---|---|---|---|
| `client_present` | boolean | `client` | `true` if object present |
| `user_agent_present` | boolean | `client.userAgent` | `true` if non-empty |
| `ip_present` | boolean | `client.ipAddress` | `true` if non-empty |

They MUST NOT emit `unusual_device` / `unusual_location` as live features unless a later profile store exists (out of Phase 5). On **eval gold**, those strings are annotator tags, not extractor output.

---

## 10. Implementation notes

- Extractors MUST be pure: `extractBaselineFeatures(event) → features`. Same event → same features.
- Do not import Prisma inside the extractor.
- Do not import `lib/elah/envelope.ts` from gold JSONL parsers (`server-only`); tests may use a shared feature module that accepts the event shape.
- Map `harm_class` from the 13 tools in `ELAH-AGT-TOOLS-001`. Injection refuse (no tool) → `injection`.
- Feature names MAY appear as `matchedSignals` / `weakSignals` (`snake_case`). They MUST NOT appear as new keys on `ScoreResponse`.

---

## 11. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree the Phase 5 baseline extracts only the five families above from one `ElahEvent`; that velocity, retry loops, session windows, and a live human profile cannot be extracted; that unusual device/location remain gold tags rather than required live envelope fields; and that features never authorize ELAH to allow, block, or execute.

---

*End of document.*
