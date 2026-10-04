# ELAH Simulator Wire (pre-tool scoring hook)

| Field | Value |
|---|---|
| Document ID | ELAH-SVC-WIRE-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-3-connect-the-existing-banking-simulator-to-the-mo` |
| Depends on | `ELAH-SPEC-INPUT-001`, `ELAH-SPEC-BOUNDARY-001`, `ELAH-AGT-CAPTURE-001` |
| Code | `lib/elah/client.ts`, `lib/agent/orchestrator.ts`, `lib/elah/score-read.ts` (live paths as implemented in this phase) |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** The client MUST NOT gate `executeTool` on `elahScore` or `policyHook`.

---

## 1. Sequence

```
utterance
    → plan tool (callLLM / fallback)
    → BANK POLICY  allow | deny | needs_confirmation     [lib/agent/policy.ts]
    → (if confirm) customer confirms
    → build ElahEvent 1.0 (executionState pre_tool | no_tool)
    → POST /v1/score   [lib/elah/client.ts → app/v1/score]
         → ScoreResponse  OR  timeout/4xx/5xx
    → persist AgentEventLog  elah_scored | elah_scoring_unavailable
         metadata = ScoreResponse JSON  OR  unavailable reason
    → if policy allow / already confirmed: executeTool
    → else: do not execute
```

Injection / policy deny: still score (`executionState: no_tool`), then **do not** execute. Low score is not what blocked the tool.

---

## 2. Orchestrator hook points (`lib/agent/orchestrator.ts`)

Call the client **after** policy context is known and **before** `executeTool`. Shared `eventId` from `mintEventId` / `runWithEventId` / `withScoringEventId`.

| Path | After | Before | Score? |
|---|---|---|---|
| Prompt injection refuse (`suspicious_prompt_detected`) | policy deny | return (no tool) | yes, `no_tool` |
| Policy deny (`policy_check_failed`) | `validateToolCall` deny | return | yes, `no_tool` |
| Confirmation required | `needs_confirmation` pending row | return (wait for confirm) | score on **confirm** path before execute, not as a second gate |
| Confirm → execute | `action_confirmed` | `executeTool` (~line 561) | **yes**, `pre_tool` |
| Auto-allow execute | `policy_check_passed` | `executeTool` (~line 978) | **yes**, `pre_tool` |

Do not call `/v1/score` from `lib/agent/tools` or from Jane’s chat UI. Do not invent ATM tools.

UI P2 actions MAY score later; MVP P0 does not require website scoring.

---

## 3. Persist on `AgentEventLog` metadata

No new Prisma columns. No `prisma db push`.

| `eventType` | When | `metadata` JSON |
|---|---|---|
| `elah_scored` | HTTP 200 with valid `ScoreResponse` | Full `ScoreResponse` (includes `status` scored \| abstained, `score`, `requestId`, `scoredAt`) |
| `elah_scoring_unavailable` | timeout, 5xx, malformed 200, or 4xx (no fake score) | `{ requestId, reason, httpStatus?, errorCode? }` |

`eventId` on the row **is** the scoring unit id. Latest row wins (`lib/elah/score-read.ts`: `loadLatestScoreSnapshot`).

Do **not** write `elahScore` onto `ElahEvent` / `envelopeForDisplay`. Do **not** put the number in `resultSummary` (customer-visible on some dashboards). Jane’s `/assistant` and customer dashboard omit these hops (`elah_scored` / `elah_scoring_unavailable` excluded from Jane’s activity query).

Analyst surface: `/admin/elah-events/[eventId]` card **ELAH score (rules_v0)**.

---

## 4. Fallback matrix

| Condition | Persist | Bank path |
|---|---|---|
| HTTP 200, `status: scored` | `elah_scored` | Follow **policy** (execute only if allow/confirmed) |
| HTTP 200, `status: abstained` | `elah_scored` (status abstained) | Still follow **policy**. Do not treat `elahScore` as decisive |
| Timeout (250 ms) | `elah_scoring_unavailable` `reason=timeout` | **Fail-open** — continue policy |
| 500 / 503 | `elah_scoring_unavailable` `reason=http_5xx` | **Fail-open** — continue policy |
| 4xx (400/413/422/409/…) | `elah_scoring_unavailable` `reason=http_4xx` (producer defect) | **No fake score.** Do not retry into a invented `ElahScore`. Policy still governs execute |
| 401 / 403 | `elah_scoring_unavailable` `reason=misconfigured` | **Not** fail-open for “ELAH said skip auth”. Fix `ELAH_SERVICE_TOKEN`. Policy still governs execute; do not pretend a score exists |
| Malformed 200 | `elah_scoring_unavailable` or flag `score_invalid` | Do not invent a second score. Policy still governs execute |

Abstain is a **successful** score. It is not unavailable.

---

## 5. ELAH cannot execute

`lib/elah/service` and `app/v1/*` MUST NOT import `executeTool`. A high `elahScore` MUST NOT skip confirmation. A low `elahScore` MUST NOT cancel an allowed tool. `policyHook` is a recommendation for analysts only.

---

## 6. Sign-off

I agree the simulator calls `POST /v1/score` after policy and before `executeTool`; that snapshots live in `AgentEventLog` metadata; that timeout/5xx fail-open, 4xx is a producer defect, 401 is misconfiguration, and abstain still follows policy; and that ELAH cannot execute.

---

*End of document.*
