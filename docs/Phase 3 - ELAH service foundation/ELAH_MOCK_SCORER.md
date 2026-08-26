# ELAH Mock Scorer (`rules_v0`)

| Field | Value |
|---|---|
| Document ID | ELAH-SVC-MOCK-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 25 August 2026 |
| Related task | `task-3-create-a-mock-scoring-implementation` |
| Depends on | `ELAH-SPEC-OUTPUT-001`, `ELAH-SPEC-SCORE-001`, `ELAH-PRD-USE-CASES-001` |
| Code | `lib/elah/service/` (live paths as implemented in this phase) |

**Product freeze (unchanged):** ELAH scores genuine banking intent. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** `rules_v0` is **not** a trained model.

---

## 1. Purpose

Deterministic `ScoreResponse` 1.0 for fixture events so the simulator, viewer, and demos can bind before Phase 6. Outputs must be stable for identical `eventId` / `mode` / body.

---

## 2. What this is / is not

| Is | Is not |
|---|---|
| Closed rules + fixture map | Gradient-trained model |
| Uncalibrated (`provenance.scorer = rules_v0`) | A fraud probability |
| Contract-faithful `ElahScore` | An allow / deny engine |
| Demo + integration baseline | Phase 6 replacement without a provenance bump |

Analyst UI MUST show `rules_v0` as uncalibrated (confidence spec C10).

---

## 3. Provenance (every `200`)

```
score.provenance.scorer = "rules_v0"
score.provenance.modelVersion = null
score.provenance.labelSource = "rules_v0"
```

Do not set `scorer: "model"` until a real model ships.

---

## 4. Fixture behaviours

Numbers match Phase 0 output-contract samples where those samples exist. Identical input → identical output (3 decimal places).

| Fixture / use case | `intentLabel` | `elahScore` | `confidence` | `status` | `policyHook` | Notes |
|---|---|---|---|---|---|---|
| External transfer (UC-P0-1) | `external_transfer` | 0.870 | 0.820 | scored | `watch` | High FR; bank still confirms |
| Internal transfer (UC-P0-2) | `internal_transfer` | 0.860 | 0.800 | scored | `none` or `watch` if FR ≥ 0.70 | Mid FR |
| Bill pay (UC-P0-3) | `bill_payment` | 0.850 | 0.800 | scored | `watch` if P0 money | Confirm is policy |
| Statement download (UC-P0-6) | `statement_download` | 0.810 | 0.780 | scored | `none` | Lower FR than a wire |
| Card freeze (UC-P0-4) | `card_freeze` | 0.840 | 0.790 | scored | `watch` | Elevated EU |
| Card unfreeze (UC-P0-5) | `card_unfreeze` | 0.830 | 0.780 | scored | `none` | |
| Balance read (UC-P1-1) | `balance_awareness` | 0.880 | 0.850 | scored | `none` | Low FR |
| Support / fraud talk (UC-P1-7) | `fraud_report` or `support_escalation` | 0.700 | 0.650 | scored | `review` if fraud | High EU |
| Prompt injection (UC-H-1) | `prompt_injection_or_policy_bypass` | 0.080 | 0.910 | scored | `review` | **No execute** — policy already denied |
| Ambiguous short utterance | `ambiguous_banking_request` | 0.480 | 0.310 | **abstained** | `review` | Full `score` still present |

Complementarity: `uncertainty = round3(1 − confidence)`.

Default when no fixture matches: score from `actionType` / `detectedIntent` / injection signals using the same band direction (genuine banking high, injection low). If confidence < 0.40 → `abstained` (output O6).

---

## 5. Hard rules

| Rule | Result |
|---|---|
| `actionType` / outcome is prompt-injection or policy refuse | Low `elahScore`, `intentLabel` `prompt_injection_or_policy_bypass`, `review` |
| `status` abstained | `elahScore` still returned; consumers treat it as non-decisive |
| `policyHook` | Never `allow` / `deny` / `block` / `confirm` |
| Extra properties on request | 4xx — do not score |

---

## 6. Sign-off

I agree `rules_v0` is a deterministic mock, not a trained model; fixture rows above are the demo baseline; provenance stays `rules_v0`; ELAH still never allows, blocks, or executes.

---

*End of document.*
