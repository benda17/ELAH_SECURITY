# ELAH Model Approach Comparison

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-CMP-001 |
| Version | **1.2** |
| Status | **Approved** — first trained scorer is **CatBoost**; offline `catboost_v0` measured on holdout and in-process latency; live scorer remains `rules_v0` |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-6-compare-rules-classical-machine-learning-small-l` |
| Depends on | `ELAH-MDL-ARCH-001`, `ELAH-BASE-EVAL-001`, `ELAH-BASE-FEAT-001`, `ELAH-BASE-RULES-001`, `ELAH-SPEC-LATENCY-001`, `ELAH-SPEC-OUTPUT-001` |
| Measured source | `data/phase5/v1.0/eval-report.json` (rules); `elah-model/artifacts/catboost_v0/metrics.json` (offline CatBoost) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy (`lib/elah/types.ts`). `rules_v0` is **uncalibrated** and is **not** a trained model. No fabricated customers, pilots, or trained-model metrics.

**This comparison records a founder selection plus one offline CatBoost run.** Live numbers remain `rules_v0` only. CatBoost holdout and in-process latency are **offline**, not a live scorer. SLM and hybrid **HTTP** serving latency stay **unmeasured**. Selecting CatBoost is not a cutover.

---

## 1. Purpose

Compare four scoring approaches for the first trained Phase 6 scorer, against the live `rules_v0` bar and the frozen latency ceiling.

Latency law (`ELAH-SPEC-LATENCY-001`): p50 **≤ 80 ms**, p95 **≤ 200 ms**, client fail-open **250 ms**. If a model cannot finish, abstain or skip — never wait past 250 ms. If it cannot hold p95, score rules first and enrich later; do **not** raise the timeout.

---

## 2. Approaches

| ID | Approach | What it is | Live today? |
|---|---|---|---|
| A | Rules-only `rules_v0` | Phase 5 feature extract + deterministic composer (`lib/elah/baseline/`) | **Yes.** `POST /v1/score` via `lib/elah/service/mock-scorer.ts`. `scorer = rules_v0`, `modelVersion = null` |
| B | **CatBoost** on Phase 5 features | Gradient-boosted trees (CatBoost) over Phase 5 features → closed 22 `intentLabel` | **No (live).** Offline artifact `catboost_v0` exists. `POST /v1/score` still `rules_v0` |
| C | Small language model on utterance / tool text | SLM / LLM classifying raw text (and perhaps tool name) on the customer path | **No.** Not measured. Not the planned first head |
| D | Hybrid rules-then-model | `rules_v0` first inside the budget; CatBoost overlays if time remains | **No.** Serving pattern if B cannot hold p95 |

All four must still emit ScoreResponse 1.0 only (`elahScore`, `confidence`, `uncertainty`, `intentLabel`, `coordinates`, `explanation`, `policyHook`, `provenance`). No new fields. None of them allow, block, or execute.

---

## 3. Measured numbers — `rules_v0` only

Source: `data/phase5/v1.0/eval-report.json` (`schemaVersion` 1.0, `generatedAt` `2026-08-26T08:33:36.319Z`, `blindedDetectedIntent` **true**, `scorer` `rules_v0`). Gold `detectedIntent` is stripped before scoring. These are **`rules_v0` vs synthetic holdout**, not a trained-model quality claim. ECE remains uncalibrated (`calibration.uncalibrated: true`). Do not quote earlier hint-echo accuracy.

| Metric | Value |
|---|---|
| Blinded holdout `n` | **100** |
| Intent accuracy | **0.79** |
| Intent macro-F1 | **~0.59** (`macroF1` 0.591…) |
| Legitimate-as-injection FP | **0** |
| Injection → P0-money FN | **1** (`azb-0005`) |
| Injection recall | **0.59** (`prompt_injection_or_policy_bypass`, support 22) |
| ECE | **0.153** (uncalibrated) |
| In-process p50 / p95 | **0.004 / 0.006 ms** (Apple M2, 10 iterations; informational vs 80 / 200 ms) |

Approaches C and D have **no** holdout accuracy. CatBoost (B) has **offline** holdout numbers (`ELAH-MDL-RUN-001`) and **in-process** latency (`ELAH-MDL-LAT-001`). SLM and hybrid HTTP latency remain **unmeasured**. Do not invent live CatBoost HTTP latency.

---

## 4. Comparison

Axes: accuracy (blinded 22-way + injection hooks), latency vs 80 / 200 / 250, explainability, ops cost, freeze risk (might it become a policy engine?).

### 4.1 Accuracy

| Approach | Blinded holdout | Notes |
|---|---|---|
| A `rules_v0` | Accuracy **0.79**, macro-F1 **~0.59**, FP **0**, FN **1** (`azb-0005`), injection recall **0.59** | Measured. Uncalibrated. Synthetic gold. Not a trained-model metric |
| B CatBoost on Phase 5 features | Accuracy **0.90**, macro-F1 **~0.89**, FP **0**, FN **0**, injection recall **1.0** (22/22 synthetic) | **Offline** blinded holdout n=100. Not live. Do not market as production 100%. Uncalibrated ECE **0.042** |
| C SLM on utterance / tool text | **Unmeasured** | No eval on holdout v1.0. Must not be quoted as better or worse |
| D hybrid rules-then-model | **Unmeasured** | Accuracy would be A, or A-then-B overlay, only after B exists and is measured |

Promotion still requires beating A on blinded holdout without rewriting gold v1.0 in place (`ELAH-MDL-ARCH-001` §5).

### 4.2 Latency vs 80 / 200 / 250

| Approach | vs p50 ≤ 80 ms / p95 ≤ 200 ms / fail-open 250 ms |
|---|---|
| A `rules_v0` | In-process p50 / p95 **0.004 / 0.006 ms** (Apple M2; informational). Well inside the ceiling. Not a network SLO |
| B CatBoost on Phase 5 features | In-process extract+predict p50 / p95 **0.176 / 2.16 ms** (darwin; `ELAH-MDL-LAT-001`). **Not** HTTP. p95 ≤ 200 ms holds in-process. Still must not cut over without founder yes. If a later HTTP measurement missed p95 → do not raise timeout; use D |
| C SLM on utterance / tool text | **Unmeasured.** Treat as **high latency risk** on the customer path. Reject as live scorer unless a later measurement shows it finishes inside **250 ms** (and holds p95). Abstain or skip if it cannot; never wait |
| D hybrid rules-then-model | **Unmeasured** as a combined path. Design intent: A always returns inside the budget; B overlays only with remaining time. Does not raise 250 ms |

### 4.3 Explainability (reason codes / features)

| Approach | Analyst-facing explanation |
|---|---|
| A `rules_v0` | `policyHook.reasons` as `RC_*`; explanation signals from explicit features (`ELAH-BASE-RC-001`, `ELAH-BASE-FEAT-001`) |
| B CatBoost on Phase 5 features | **Unmeasured** quality, but the input is the same named features. Feature importances / per-example contributions can map to existing `RC_*` and signal strings. No new ScoreResponse field |
| C SLM on utterance / tool text | **Unmeasured.** Token-level or free-text rationales are freeze-hostile (PII, chain-of-thought, extra fields). Would still have to compress into `matchedSignals` / `RC_*` |
| D hybrid rules-then-model | Rules codes always present; model overlay may add feature-based signals if it ran. Overlay skip MUST still return a valid ScoreResponse 1.0 from A |

### 4.4 Ops cost

| Approach | Ops (qualitative; no invented $) |
|---|---|
| A `rules_v0` | Already shipped. Deterministic. No training loop. Colocated Next.js |
| B CatBoost on Phase 5 features | Training + versioned artifact + holdout eval + `modelVersion` discipline. Inference is CPU-class if it stays on Phase 5 features. Colocate until second client or p95 threat (`ELAH-ARCH-OWN-001`) |
| C SLM on utterance / tool text | **Unmeasured** cost and latency. Likely GPU or remote runtime → extract trigger. Higher serving and eval burden |
| D hybrid rules-then-model | A plus optional B. Extra branch complexity; no extra product verbs |

None of these costs are a reason to add allow / deny to ELAH.

### 4.5 Freeze risk (might it become a policy engine?)

| Approach | Freeze risk |
|---|---|
| A `rules_v0` | Low if `policyHook.recommendation` stays `none` / `watch` / `review` / `step_up_hint`. Rules can still be misread as policy; UI must not grow “ELAH Allow / Block” |
| B CatBoost on Phase 5 features | Similar to A if outputs stay ScoreResponse 1.0. Risk rises if someone gates `executeTool` on `elahScore` |
| C SLM on utterance / tool text | **Higher.** Free-form generation invites extra fields, extra verbs, and “the model refused / allowed.” Forbidden. Even a well-behaved SLM that only emits the 22 labels is still not the first head |
| D hybrid rules-then-model | Medium if the overlay is treated as a second gate. The pattern is **score then maybe enrich**, not **rules deny then model allow**. ELAH still never allows, blocks, or executes |

---

## 5. Selection (founder, 26 August 2026)

**First trained scorer: CatBoost** on Phase 5 features (approach B). Gradient-boosted trees. Fits ELAH because events are mostly structured and categorical (action type, tool name, user tier, policy state, risk tags, intent labels, agent behavior, context signals). Same `ElahEvent` 1.0, same encoder (`lib/elah/baseline/features.ts`), closed 22-way head, ScoreResponse 1.0 only (`elahScore`, label, confidence, coordinates, explanation, provenance). Not an LLM on the customer path. ELAH still never allows, blocks, confirms, or executes.

**Serving pattern if B cannot hold p95:** hybrid rules-then-model (approach D). In-process B p95 **holds** (2.16 ms). Hybrid remains **prepare-only**. Score `rules_v0` first; overlay CatBoost only with remaining budget; abstain or skip the overlay; **do not raise 250 ms**. Do not cut over without founder yes.

**Reject** a small language model on the customer path (approach C) unless a later measurement shows it meets the **250 ms** fail-open (and p95). It is **not measured**; treat it as high latency risk. Off-path research is out of scope for this comparison.

A linear / logistic head is **not** the selected first scorer.

`rules_v0` (approach A) **stays live** until B is integrated **and** holds latency under `ELAH-MDL-ARCH-001` §5. Offline, B beat blinded holdout accuracy / FP / FN on 30 August 2026. Until cutover: `scorer = rules_v0`, `modelVersion = null`.

---

## 6. Non-goals

- Inventing live HTTP latency for B, or any F1 / accuracy / ECE / latency for C / D
- Quoting hint-echo accuracy as the Phase 5 bar
- Raising p50 / p95 / 250 ms
- Training a model in this document
- Changing TypeScript, Prisma, or eval scripts
- Making ELAH an allow / deny engine, a TM replacement, or a customer-visible score
- ATM, beneficiary-write, `device_change`, or rewriting gold v1.0 in place

---

## 7. Related documents

| Document | Role |
|---|---|
| [ELAH_MODEL_ARCHITECTURE.md](./ELAH_MODEL_ARCHITECTURE.md) | Planned encoder + CatBoost head + hybrid serving |
| `docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_EVAL.md` | Measured `rules_v0` holdout |
| `docs/Phase 5 - Baseline scoring system/ELAH_BASELINE_FEATURES.md` | Feature families CatBoost would reuse |
| `docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_LATENCY.md` | 80 / 200 / 250 ms |

---

## 8. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder | Founder | 26 August 2026 | **Approve** — first trained scorer is CatBoost |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree ELAH scores genuine banking intent **before tool execution**; that bank policy allow / deny / confirm; that **ELAH never allows, blocks, or executes**; that scores are **not** fields of `ElahEvent`; that Jane / customer UI MUST NOT show `elahScore`; that there is no ATM, beneficiary-write, or `device_change` product; that the taxonomy stays the closed 22 labels; that `rules_v0` is **uncalibrated** and is **not** a trained model; that live `rules_v0` holdout numbers remain accuracy **0.79**, macro-F1 **~0.59**, FP **0**, FN **1** on `azb-0005`, injection recall **0.59**, ECE **0.153**, in-process p50/p95 **0.004 / 0.006 ms**; that offline CatBoost holdout is accuracy **0.90**, FP **0**, FN **0**, uncalibrated ECE **0.042**, in-process p95 **2.16 ms** and is **not** live; that SLM and hybrid HTTP latency stay **unmeasured**; that the first trained scorer is **CatBoost** on Phase 5 features; that an SLM is rejected on the customer path unless it meets **250 ms**; and that **selecting CatBoost is not a live cutover.**

---

*End of document.*
