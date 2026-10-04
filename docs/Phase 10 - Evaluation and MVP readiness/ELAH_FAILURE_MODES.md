# ELAH failure modes, timeouts, and data isolation (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-FAIL-001 |
| Version | **1.0** |
| Status | **Recorded** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-10-run-failure-mode-tests`, `task-10-run-data-loss-tests`, `task-10-run-service-timeout-tests` |
| Tests | `tests/elah/client-failopen.test.ts`, `tests/elah/phase10-data-loss.test.ts`, `tests/elah/score-contract.test.ts` |

**Product freeze (unchanged):** Scorer down ≠ tool blocked. Fail-open 250 ms → `scoring_unavailable`. Scores are not envelope fields. CRM gold/DB is not mixed into banking Neon.

---

## 1. Failure modes

| Mode | Required behavior | Evidence |
|---|---|---|
| Scorer hangs | Client aborts ~250 ms, `kind: unavailable`, `reason: timeout`, **no throw** | `client-failopen.test.ts` |
| Scorer HTTP 503 | `unavailable` / `unavailable`, banking continues | same |
| Invalid contract | 4xx validation error, not a silent score | `score-validation` / `handle-score` |
| Missing token | Unauthorized, not a score | `handle-score` authorize |
| Idempotent retry | Same `Idempotency-Key` + body → stored response | service idempotency store |

ELAH never becomes the bank’s allow/deny because the scorer failed.

---

## 2. Service timeout

`lib/elah/client.ts`: `DEFAULT_SCORE_TIMEOUT_MS = 250`, overridable via `ELAH_SCORE_TIMEOUT_MS`. In-process and fetch paths both race this deadline.

Do **not** raise 250 ms in this phase.

---

## 3. Data-loss / isolation

| Risk | Control | Evidence |
|---|---|---|
| Score written onto `ElahEvent` JSON | `envelopeForDisplay` strips `elahScore` / `elahScoreLabel` | `phase10-data-loss.test.ts`, `score-read.test.ts` |
| ScoreResponse leaks onto request envelope | Closed keys; body has `score` nested | `score-contract.test.ts` |
| Customer sees analyst fields | Customer routes contain no `elahScore` | `phase10-customer-ui.test.ts` |
| Banking gold mixed with CRM | Separate datasetVersion / separate CRM DB | Phase 4 + Phase 16; founder `.env` CRM SQLite is not this Neon |
| Snapshot vs envelope | Scores persist on `AgentEventLog` hops / training columns, **not** as envelope fields | `lib/elah/score-persist.ts` |

“Data loss” here means **losing the isolation invariant** (score contaminating the event or Jane’s UI), not a backup-restore drill. No backup-restore test was run.

---

## 4. Sign-off

I agree fail-open, 250 ms timeout, and envelope/score isolation are tested; this is not a disaster-recovery exercise.

---

*End of document.*
