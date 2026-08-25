# ELAH Confidence and Uncertainty Semantics

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-CONFIDENCE-001 |
| Spec version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related roadmap task | `task-0-define-confidence-and-uncertainty-semantics` |
| Depends on | `ELAH-PRD-MVP-SCOPE-001`, `ELAH-SPEC-OUTPUT-001` (field names and complementarity) |
| Does not own | `elahScore` direction and intent-band copy (score-semantics task); HTTP fail-open (input contract); tenant numeric overrides (threshold-config task); graph glyph/opacity drawing (Phase 7 visual task); reliability plots on live models (Phase 6) |

---

## 1. Purpose

Analysts see two numbers next to every scored event: **intention** (`elahScore`) and **confidence** (`confidence` / `uncertainty`). If those two are not defined, a SOC operator will treat a shaky 0.87 as a hard “genuine” and a well-supported 0.12 as a hard “block”.

This document freezes:

1. **Units** and complementarity (already required by the output contract; restated here so UI authors do not re-invent them).
2. **What the numbers mean** (calibration *intent*).
3. **When ELAH withholds** treating the intention score as decisive (`status: abstained`).
4. **Example UI copy** for list, detail, graph, and SOC queue.

**Product fence (MVP):** ELAH still does **not** allow, deny, confirm, or execute. Bank policy already decided that. Confidence tells the analyst whether **ELAH’s score is usable**, not whether the bank should run the tool.

Without this, dashboards invent “Low / Medium / High” independently, and “withhold a decision” gets implemented as a second policy engine.

---

## 2. Plan executed

| Step | Result |
|---|---|
| 1. Bound the object | `confidence` + `uncertainty` on `ElahScore`; `status` on the envelope |
| 2. Named the quantity | Reliability of the *(elahScore, intentLabel)* pair, not P(fraud) |
| 3. Calibration intent | Target: reported *c* ≈ empirical correctness; `rules_v0` is **uncalibrated** |
| 4. Display bands | High / Moderate / Low (copy only; not enforcement) |
| 5. Withhold rule | `status: abstained`; default `confidence < 0.40` plus conflict rule |
| 6. UI copy | §8 list, detail, tooltip, banner, queue, fail-open |
| 7. Worked examples | Output-contract samples 8.1–8.3 |

---

## 3. Frozen decisions

| ID | Decision |
|---|---|
| C1 | `confidence` and `uncertainty` are **unitless probabilities in [0.00, 1.00]**, three decimal places. They are **not** percents in the JSON (UI MAY render `82%`). |
| C2 | `uncertainty = round3(1 − confidence)` (absolute error ≤ 0.001). Dashboards bind **either**; they MUST NOT invent a third uncertainty formula. |
| C3 | `confidence` is ELAH’s estimate that **this** `(elahScore, intentLabel)` pair is a **reliable reading** of genuine-intent evidence. It is **not** P(fraud), **not** P(allow), **not** a second `elahScore`. |
| C4 | **High** `confidence` can sit on a **low** `elahScore` (injection, well supported). **Low** `confidence` can sit on a **high** `elahScore` (thin evidence). The two axes are independent. |
| C5 | Display bands (UI only): **High** `≥ 0.75`, **Moderate** `[0.40, 0.75)`, **Low** `< 0.40`. Band labels MUST NOT be written back as API fields. |
| C6 | **Withhold** means set `status: "abstained"` and treat `elahScore` as **non-decisive**. It does **not** cancel the tool. The simulator follows **bank policy**. |
| C7 | Producer **SHOULD** abstain when `confidence < 0.40` (v1 default, same as output O6). Producer **SHOULD** also abstain on the conflict rule in §6.2 even if confidence ≥ 0.40. |
| C8 | Consumers key off **`status`**, not a hardcoded 0.40. Tenant overrides of the cutoff belong to the threshold-config task. |
| C9 | `scoring_unavailable` (timeout / 5xx) is **not** abstention. Different copy (§8.6). |
| C10 | `provenance.scorer = rules_v0` (and `intent_matrix` until a calibration note exists) MUST be shown as **uncalibrated** in analyst UI. Calibration *intent* still applies as the target for models. |
| C11 | Customer-facing assistant UI MUST NOT show confidence, uncertainty, or abstention. Those are analyst/SOC/policy-engine fields. |
| C12 | UI copy MUST NOT say “ELAH blocked”, “ELAH allowed”, or “deny because low confidence”. Escalation language is **review / do not treat as decisive**. |

---

## 4. Units and fields

| API field | Where | Unit | Live store today |
|---|---|---|---|
| `confidence` | `ScoreResponse.score` | `[0,1]`, 3 d.p. | `ElahTrainingEvent.labelConfidence` |
| `uncertainty` | `ScoreResponse.score` | `[0,1]`, 3 d.p. | Not stored; derive on read/write |
| `status` | `ScoreResponse` | `scored` \| `abstained` | Not a training column; envelope only |

**Display:**

| Internal | Analyst-visible default |
|---|---|
| `confidence: 0.82` | `82%` or `0.82` — pick one per surface and keep it |
| `uncertainty: 0.18` | Optional second line: `Uncertainty 18%` |
| `status: abstained` | Badge **Abstained** (not “failed”, not “blocked”) |

MVP list views SHOULD show **confidence** (or the High/Moderate/Low word). Detail views SHOULD show both confidence and uncertainty.

---

## 5. What the quantity is

### 5.1 Calibration intent (normative target)

Among events where ELAH reports confidence ≈ *c* (in a bin, e.g. 0.80–0.85), the fraction of those events whose `(intentLabel, elahScore-band)` is later judged **correct** by the golden set / annotator SHOULD be approximately *c*.

That is the reliability-diagram / expected calibration error (ECE) target. Phase 6 **measures** it. This spec **names** it.

Until a model is calibrated:

- `rules_v0` / uncalibrated `intent_matrix` confidence is a **heuristic strength-of-evidence** score. It still uses the same `[0,1]` unit so the dashboard does not change when the model ships.
- UI MUST qualify it (C10): “Uncalibrated (rules)”.

### 5.2 What it is not

| Not this | Why |
|---|---|
| Inverse of `elahScore` | Injection can be low score + high confidence |
| Policy decision | Bank policy already allow/deny/confirm |
| Fraud probability | Out of MVP product fence |
| Annotator self-rating | Phase 4 confidence labels are a **labeling** field; do not overload `score.confidence` |
| Timeout / missing score | That is `scoring_unavailable` |

### 5.3 Independence from intention

```
elahScore     = how genuine the request looks
confidence    = how much we should trust that reading
```

| | High confidence | Low confidence |
|---|---|---|
| High `elahScore` | Usable “looks genuine” | Looks genuine **but thin evidence** → abstain / do not lean on the number |
| Low `elahScore` | Usable “off-intent / hostile” | Unclear; do not treat as a confirmed attack |

---

## 6. When to withhold (abstention)

### 6.1 Meaning of withhold

ELAH **withholds a scoring decision**, not a banking decision.

| Actor | On `status: abstained` |
|---|---|
| ELAH | Still returns a full `ElahScore`. `policyHook.recommendation` SHOULD be `review`. |
| Simulator | Continues the tool path already authorised by **policy**. Does not invent a score. |
| Analyst UI | Shows the number **muted** + **Abstained** badge + copy in §8.3. MUST NOT present `elahScore` as a calibrated KPI. |
| SOC / queue | MAY enqueue because of `policyHook: review`, not because ELAH blocked. |

### 6.2 Producer rules (v1)

Apply **in order**. First match wins.

1. If the request was never scored (timeout, 5xx): **do not** emit `ScoreResponse`. Caller records `scoring_unavailable` (input contract).
2. If `confidence < 0.40`: `status = abstained` (default cutoff).
3. If **conflict**: `matchedSignals.length ≥ 2` AND `negativeSignals.length ≥ 2` AND `abs(elahScore − 0.50) < 0.20`: `status = abstained` even when confidence ≥ 0.40. Reason: evidence pulls both ways; the point estimate is not decisive.
4. Else: `status = scored`.

A producer MAY abstain for other documented reasons (empty utterance, unknown tool after sanitization). It MUST still return a full `score` object.

### 6.3 Consumer rules

- If `status === "abstained"`: ignore band math on `elahScore` for alerts. Still **plot** the point (grey / dashed).
- If `status === "scored"`: apply score-semantics bands (separate task) **and** show the confidence band from §7.
- Never convert Low confidence into `policy.decision = deny`.

---

## 7. Display bands (UI only)

| Band | `confidence` | Word | Colour intent (tokens, not hex law) |
|---|---|---|---|
| High | `≥ 0.75` | High confidence | Positive / stable (emerald) |
| Moderate | `[0.40, 0.75)` | Moderate confidence | Neutral (cyan / default ink) |
| Low | `< 0.40` | Low confidence | Warning (amber). If also abstained, use the abstain badge (rose/amber), not “error”. |

Threshold-config MAY move the 0.40 / 0.75 cuts per tenant. **Words stay.** JSON does not grow a `confidenceBand` field in v1.

---

## 8. Example UI copy (normative for MVP demo)

Surfaces: founder/analyst event **list**, event **detail**, intention **graph** caption, SOC **queue**. Customer chat: **none of this**.

### 8.1 List cell

Pattern: `{elahScore as 0.00} · {band word}` plus abstain if needed.

| Condition | Copy |
|---|---|
| Scored, high confidence | `0.87 · High confidence` |
| Scored, moderate | `0.81 · Moderate confidence` |
| Abstained | `0.48 · Abstained` |
| Uncalibrated scorer | `0.87 · High confidence · Uncalibrated (rules)` |
| Missing score | `Score unavailable` |

Do not show raw `uncertainty` on the list (too dense).

### 8.2 Detail — header

```
Intention  0.87
Confidence 82%  (uncertainty 18%)
Status     Scored
```

If `rules_v0`:

```
Confidence 82%  — Uncalibrated (rules). Treat as strength of evidence, not a probability.
```

### 8.3 Detail — abstain banner (required)

**Title:** `ELAH abstained`

**Body:** `Confidence is too low to treat this intention score as decisive. Bank policy still governs whether the tool runs. Queue for review; do not allow or block from this number.`

**Do not use:** `ELAH blocked this transfer.` / `Safe to allow.`

### 8.4 Tooltips

| Control | Copy |
|---|---|
| Intention value | `How genuine this request looks (0 = off-intent or hostile, 1 = genuine banking intent). Not an allow/deny.` |
| Confidence value | `How much to trust that intention reading. High confidence can attach to a low score (e.g. clear injection).` |
| Uncertainty value | `1 minus confidence. Same information; use for error-bar views.` |
| Abstained badge | `ELAH withheld a scoring decision. The bank’s policy decision is unchanged.` |
| Uncalibrated chip | `Rules baseline. Not reliability-calibrated. Model calibration is a later release.` |

### 8.5 SOC / review queue reason

When `policyHook.recommendation = review` because of abstention:

```
Review: ELAH abstained (low confidence). Policy: {event.policy.decision}. Tool not gated by ELAH.
```

When scored injection (high confidence, low score):

```
Review: prompt injection / policy bypass. Intention 0.08 with high confidence. Policy already refused. No tool executed.
```

### 8.6 Fail-open (not abstention)

**Title:** `Score unavailable`

**Body:** `ELAH did not respond in time. The assistant continued under bank policy only. No intention score to review.`

### 8.7 Graph caption (until Phase 7 visual spec)

```
Point position = intention coordinates. Opacity recommended = confidence.
Hollow / dashed outline = abstained. Missing point = score unavailable.
```

Phase 7 owns the exact glyph. This caption is the interim copy.

### 8.8 Empty explanation + low confidence

```
Few evidence signals. Do not lean on the intention number.
```

---

## 9. Worked examples

Samples match `ELAH-SPEC-OUTPUT-001` §8.

### 9.1 P0 external transfer — scored, high confidence

`elahScore 0.87`, `confidence 0.82`, `uncertainty 0.18`, `status: scored`, scorer `rules_v0`.

| Surface | Copy |
|---|---|
| List | `0.87 · High confidence · Uncalibrated (rules)` |
| Detail | Intention 0.87. Confidence 82% (uncertainty 18%). Status Scored. Uncalibrated (rules). |
| Analyst action | Read explanation. Bank confirmation still required. Do not “allow” from ELAH. `policyHook: watch` is a glance, not a gate. |

### 9.2 Prompt injection — scored, high confidence, low intention

`elahScore 0.08`, `confidence 0.91`, `status: scored`.

| Surface | Copy |
|---|---|
| List | `0.08 · High confidence` |
| Queue | Review: prompt injection / policy bypass. Intention 0.08 with high confidence. Policy already refused. No tool executed. |
| Analyst action | Trust the **low** score (well supported). Still not an ELAH block — policy already refused. |

### 9.3 Ambiguous short utterance — abstained

`elahScore 0.48`, `confidence 0.31`, `uncertainty 0.69`, `status: abstained`.

| Surface | Copy |
|---|---|
| List | `0.48 · Abstained` |
| Banner | ELAH abstained. Confidence is too low to treat this intention score as decisive. Bank policy still governs whether the tool runs. Queue for review; do not allow or block from this number. |
| Analyst action | Ignore 0.48 as a KPI. Read weakSignals. Likely no tool. |

### 9.4 Invalid interpretations (reject in review / QA)

| Wrong reading | Why |
|---|---|
| “82% chance we should allow” | Confidence is not P(allow) |
| “0.31 confidence → deny the transfer” | Withhold ≠ deny |
| “Uncertainty 18% so score is 0.87±0.18 on the intention axis” | Uncertainty is not an error bar on `elahScore` |
| Hide the score when abstained | Output contract requires the number; UI mutes it, does not delete it |

---

## 10. Implementation notes (live simulator)

- Today `labelConfidence` is often copied from matrix confidence or even the intention score (`lib/elah/training-event.ts`). That **collapses the two axes**. The mock `/v1/score` and the rules baseline MUST emit **independent** `confidence` using this spec.
- Persist `uncertainty` on write or derive on read; do not store a disagreeing value.
- Analyst list/detail (Phase 9) MUST implement §8.3 before calling the MVP demo “explainable”.

---

## 11. Out of scope

- `elahScore` band copy (`high intent` / `review`) — score-semantics task.
- Moving 0.40 / 0.75 per tenant — threshold-config task.
- ECE plots and temperature scaling — Phase 6.
- Exact graph opacity math — Phase 7.
- Annotator confidence enum on labeled rows — Phase 4 labeling guidelines (may *cite* this document).

---

## 12. Related documents

| Document | Role |
|---|---|
| `docs/Phase 0 - Product Definition/ELAH_MVP_SCOPE.md` | Abstention exists; ELAH does not allow/block |
| `docs/Phase 0 - Product Definition/ELAH_OUTPUT_CONTRACT.md` | Field names, O5/O6, samples 8.1–8.3 |
| `docs/Phase 0 - Product Definition/ELAH_INPUT_CONTRACT.md` | `scoring_unavailable` vs 200 body |
| `docs/Phase 0 - Product Definition/ELAH_COORDINATE_SYSTEM.md` | Graph axes; abstain keeps the point |
| Score semantics (forthcoming) | Bands on **intention**, not confidence |
| Threshold config (forthcoming) | Tenant overrides of C7/C5 cuts |

---

## 13. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | | | Approve / Approve with comments / Reject |
| Engineering | | | |
| Security / analyst UX | | | |

**Approval statement:** I agree that `confidence` / `uncertainty` are complementary `[0,1]` reliability numbers on the intention reading; that High/Moderate/Low are display bands only; that abstention withholds a **scoring** decision while bank policy still governs the tool; that `rules_v0` is shown as uncalibrated; and that the §8 UI copy is the MVP wording (no “ELAH allowed/blocked”).

---

*End of document.*
