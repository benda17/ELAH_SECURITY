# ELAH score consistency (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-CONS-001 |
| Version | **1.0** |
| Status | **Recorded** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-validate-score-consistency` |
| Test | `tests/elah/phase10-score-consistency.test.ts` |
| Scorer | `rules_v0` via `lib/elah/baseline/score.ts` |

**Product freeze (unchanged):** Same envelope → same score. Scores are not envelope fields.

---

## 1. Rule

For a fixed `ElahEvent` 1.0, live `rules_v0` MUST return the same `intentLabel`, `elahScore`, `confidence`, `uncertainty`, coordinates, and `policyHook` on repeat. No hidden clock, RNG, or tenant threshold input.

`scoredAt` on the HTTP `ScoreResponse` MAY differ; it is metadata, not the score.

---

## 2. Evidence (28 Sep 2026)

Transfer sample 8.1 and injection sample 8.3 each scored three times (including a structured clone) — identical cores. Fixture lock: transfer `elahScore` **0.87**, injection **0.08**.

Idempotency of `POST /v1/score` is a **transport** guarantee (same key + body). Consistency here is **pure function** of the envelope.

---

## 3. Sign-off

I agree `rules_v0` is deterministic on a fixed envelope; HTTP `scoredAt` may change.

---

*End of document.*
