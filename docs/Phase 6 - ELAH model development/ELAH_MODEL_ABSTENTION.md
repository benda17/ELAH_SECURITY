# ELAH Model Abstention Behavior

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-ABS-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-6-define-abstention-behavior-for-uncertain-cases` |
| Depends on | `ELAH-SPEC-CONFIDENCE-001` (C1–C12), `ELAH-SPEC-OUTPUT-001` (O6), `ELAH-SPEC-INPUT-001` (I9–I10) |
| Code (read-only for this memo) | `lib/elah/service/types.ts` (`ScoreResponse.status`) |
| Does not own | New `ScoreResponse` fields; runtime tests; tenant cutoff overrides; Jane / customer UI |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`, confidence, uncertainty, or abstention. No ATM, beneficiary-write, or `device_change` product. Closed 22 labels. `rules_v0` is uncalibrated and is not a trained model. Offline CatBoost does not change these rules.

This memo **specializes** Phase 0 confidence and output contracts for a trained scorer (live or offline). It does **not** fork a second meaning of `confidence`. Do not add `ScoreResponse` fields. Runtime wiring of abstention from CatBoost is **not** shipped — live path is still `rules_v0`.

---

## 1. Purpose

When a trained model is uncertain, ELAH withholds treating `(elahScore, intentLabel)` as decisive. That withhold is already named: `ScoreResponse.status = "abstained"`.

This document tells Phase 6 implementers:

1. Use the **same** `status` field and the **same** confidence quantity as Phase 0.
2. If inference cannot finish inside the **250 ms** client ceiling, **fail-open / skip** — that is `scoring_unavailable`, not abstention.
3. Analyst copy is **review / do not treat as decisive**. Never “ELAH denied.”
4. `policyHook` remains a hint. Bank policy still governs the tool.

Without this, a model author will invent `modelUncertain`, treat Low confidence as a deny, or wait past 250 ms to “finish the score.”

---

## 2. What this does not change

Confidence is defined in `docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md` (`ELAH-SPEC-CONFIDENCE-001`). A trained scorer inherits that definition. It MUST NOT invent a second quantity (P(fraud), P(allow), “model certainty”, temperature, entropy-as-confidence) under the same field name.

| ID | Frozen meaning (restated, not redefined) |
|---|---|
| C1 | `confidence` and `uncertainty` are unitless probabilities in `[0.00, 1.00]`, three decimal places. Not percents in JSON. |
| C2 | `uncertainty = round3(1 − confidence)` (absolute error ≤ 0.001). |
| C3 | `confidence` is reliability of **this** `(elahScore, intentLabel)` pair. **Not** P(fraud). **Not** P(allow). **Not** a second `elahScore`. |
| C4 | High confidence can sit on a low `elahScore`. Low confidence can sit on a high `elahScore`. Axes are independent. |
| C5 | Display bands are UI copy only: **High** `≥ 0.75`, **Moderate** `[0.40, 0.75)`, **Low** `< 0.40`. Not API fields. |
| C6 | **Withhold** = `status: "abstained"`. Treat `elahScore` as **non-decisive**. It does **not** cancel the tool. The simulator follows **bank policy**. |
| C7 | Producer **SHOULD** abstain when `confidence < 0.40` (v1 default). Conflict rule in C-spec §6.2 still applies even if confidence ≥ 0.40. |
| C8 | Consumers key off **`status`**, not a hardcoded 0.40. Tenant overrides belong to the threshold-config task. |
| C9 | `scoring_unavailable` (timeout / 5xx) is **not** abstention. |
| C10 | `provenance.scorer = rules_v0` is **uncalibrated** and is **not** a trained model. Calibration *intent* remains the target for models. |
| C11 | Jane / customer UI MUST NOT show confidence, uncertainty, or abstention. |
| C12 | Copy MUST NOT say “ELAH blocked”, “ELAH allowed”, or “deny because low confidence.” Escalation language is **review / do not treat as decisive**. |

Output contract `ELAH-SPEC-OUTPUT-001` **O6:** producer **SHOULD** set `status: "abstained"` when `confidence < 0.40` (v1 sample default). Consumers still key off `status` (C8). Abstention still returns a full `score` object (O3).

Live type already matches. Do not grow it:

```ts
status: "scored" | "abstained"   // ScoreResponse in lib/elah/service/types.ts
```

---

## 3. Trained model uses the same `status` field

| Rule | Requirement |
|---|---|
| Field | `ScoreResponse.status` only |
| Values | `"scored"` \| `"abstained"` |
| Score body | Full `ElahScore` **always** present when a 200 `ScoreResponse` is returned, including when abstained |
| New API field | **Forbidden** for this task (`modelUncertain`, `abstainReason` as a top-level key, `confidenceBand`, `shouldBlock`) |
| Envelope | Scores remain **not** fields of `ElahEvent` |
| Prisma | Do not `prisma db push` to persist abstention as an envelope column |

When `provenance.scorer` is `"model"` or `"hybrid"`, `status` still means the same thing it means for `rules_v0`: whether the intention reading is **usable as decisive**. Switching scorer does not switch semantics.

Producer order (same as C-spec §6.2; first match wins):

1. Request never scored (timeout, 5xx, abort at 250 ms): **do not** emit `ScoreResponse`. Caller records `scoring_unavailable`.
2. `confidence < 0.40`: `status = "abstained"` (v1 default; C7 / O6).
3. Conflict rule: `matchedSignals.length ≥ 2` AND `negativeSignals.length ≥ 2` AND `abs(elahScore − 0.50) < 0.20`: `status = "abstained"` even if confidence ≥ 0.40.
4. Else: `status = "scored"`.

A model MAY abstain for other **documented** reasons (empty utterance, unknown tool after sanitization, empty evidence). It MUST still return a full `score` object on 200. It MUST NOT invent a score on the fail-open path.

---

## 4. Miss the 250 ms ceiling: fail-open / skip

Client handshake is **250 ms** then continue (`ELAH-SPEC-INPUT-001` I9–I10). That ceiling is **not** raised for a model.

If inference would miss 250 ms:

| MUST | MUST NOT |
|---|---|
| Abort / skip scoring | Wait for the model |
| Record `scoring_unavailable` | Invent an `ElahScore` |
| Continue the tool path already authorised by **bank policy** | Block the tool because the model was slow |
| Analyst UI: **Score unavailable** (C-spec §8.6) | Emit `status: "abstained"` as a stand-in for timeout |

A slow model is an **availability** failure of the scorer, not an uncertain intention reading. C9: `scoring_unavailable` is **not** abstention.

An SLM (or any model) on the customer path is a latency risk. Until measured against I10, treat “might miss 250 ms” as a **skip** design, not a “hold the tool” design. Measuring and wiring that skip is **out of this documentation pass**.

---

## 5. Abstention vs fail-open

| | Abstention | Fail-open / skip |
|---|---|---|
| When | Scorer **did** return 200; reading is not decisive | Scorer **did not** return a usable 200 in time (timeout, 5xx) |
| Envelope | `ScoreResponse` with `status: "abstained"` and a full `score` | No `ScoreResponse`. Caller records `scoring_unavailable` |
| `elahScore` | Present; **muted** / non-decisive | **Absent**. Do not invent one |
| Confidence | Typically `< 0.40` under v1 default; consumers still key off `status` | Not applicable |
| Tool path | Bank policy already decided. **C6: does not cancel the tool** | Bank policy already decided. **I9: do not block because ELAH was down** |
| Analyst badge | **Abstained** | **Score unavailable** |
| Analyst copy | §6 (review; do not treat as decisive) | C-spec §8.6: ELAH did not respond in time; assistant continued under bank policy only |
| Jane / customer UI | Must not show status, score, or confidence | Must not show unavailable / skip either |

Both paths leave **execution** to the bank. Neither is an ELAH allow, deny, or block.

---

## 6. Analyst copy

Surfaces: founder / analyst event list, event detail, SOC queue. **Not** Jane. **Not** `/assistant`.

Normative wording is already in C-spec §8. Restated so model work does not drift:

| Surface | Copy |
|---|---|
| Abstain banner title | `ELAH abstained` |
| Abstain banner body | `Confidence is too low to treat this intention score as decisive. Bank policy still governs whether the tool runs. Queue for review; do not allow or block from this number.` |
| SOC queue (abstention) | `Review: ELAH abstained (low confidence). Policy: {event.policy.decision}. Tool not gated by ELAH.` |
| Fail-open title | `Score unavailable` |
| Fail-open body | `ELAH did not respond in time. The assistant continued under bank policy only. No intention score to review.` |
| Uncalibrated (until a calibration note exists) | Qualify confidence as uncalibrated. `rules_v0` stays **Uncalibrated (rules)** (C10). |

**Forbidden copy** (C12): `ELAH denied.` `ELAH blocked this transfer.` `ELAH allowed.` `Safe to allow.` `Deny because low confidence.` `Model refused the tool.`

Abstention withholds a **scoring** decision. Bank policy still allow / deny / confirm.

---

## 7. `policyHook` is still a hint

On abstention, `policyHook.recommendation` **SHOULD** be `review` (`ELAH-SPEC-OUTPUT-001` §5.6). A scored event MAY still carry `watch`, `review`, or `step_up_hint`.

Those values are **hints**, not enforcement:

| `recommendation` | Meaning |
|---|---|
| `none` | No extra analyst attention required by ELAH |
| `watch` | Optional SOC glance |
| `review` | Queue for analyst. Typical on abstention and on injection labels |
| `step_up_hint` | Hint that the **bank** MAY add confirmation / MFA. ELAH does not perform step-up |

Forbidden on `policyHook` (and anywhere on `ScoreResponse`): `allow`, `deny`, `block`, `confirm`, `execute`, `decision`. Those words belong to `event.policy.decision` only.

A model that abstains MUST NOT convert that into `policy.decision = deny`. Consumers MUST NOT gate `executeTool` on `status`, `elahScore`, or `policyHook`.

---

## 8. Runtime tests — out of this pass

This document **does not** add, specify, or require runtime tests, fixtures, CI gates, or scorer wiring.

Out of this documentation pass:

- Tests that emit `status: "abstained"` from a trained model
- Tests that abort at 250 ms and persist `scoring_unavailable`
- Changing `lib/elah/service/mock-scorer.ts` or `lib/elah/baseline/`
- Training a model
- Adding `ScoreResponse` fields
- Jane-visible badges

Implementers MUST follow C1–C12, O6, and I9–I10 when those tests are written later. This memo is the **behavior contract**, not the test plan.

---

## 9. Related documents

| Document | Role |
|---|---|
| `docs/Phase 0 - Product Definition/ELAH_CONFIDENCE_SEMANTICS.md` | C1–C12; withhold ≠ cancel; bands are copy only |
| `docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md` | O3 / O6; `status`; `policyHook` enum |
| `docs/Phase 0 - Product Definition/ELAH_INPUT_CONTRACT.md` | I9–I10; 250 ms fail-open; `scoring_unavailable` |
| `lib/elah/service/types.ts` | `ScoreStatus = "scored" \| "abstained"` — no new field |
| `docs/Phase 6 - ELAH model development/ELAH_MODEL_LIMITATIONS.md` | Abstention is not enforcement; no trained model yet |

---

## 10. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree that a future trained scorer uses the same `ScoreResponse.status` (`scored` \| `abstained`) and the same confidence meaning as C1–C12 (reliability of `(elahScore, intentLabel)`, not P(fraud)/P(allow)); that C6 withhold does not cancel the tool; that missing the 250 ms ceiling is fail-open / `scoring_unavailable` (C9), never an invented score and never a block; that Jane never sees these fields; and that **abstention is not a block**. ELAH still never allows, blocks, or executes. Bank policy remains allow / deny / confirm.

---

*End of document.*
