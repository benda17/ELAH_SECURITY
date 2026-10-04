# ELAH Baseline Evaluation

| Field | Value |
|---|---|
| Document ID | ELAH-BASE-EVAL-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-5-evaluate-the-baseline-against-labeled-scenarios`, `task-5-measure-false-positives`, `task-5-measure-false-negatives`, `task-5-measure-precision-and-recall`, `task-5-measure-calibration`, `task-5-measure-latency` |
| Depends on | `ELAH-DATA-EVAL-001`, `ELAH-DATA-VER-001`, `ELAH-SPEC-OUTPUT-001`, `ELAH-SPEC-CONFIDENCE-001`, `ELAH-SPEC-LATENCY-001`, `ELAH-BASE-RULES-001` |
| Gold | `data/phase4/v1.0/splits/holdout.jsonl` (`n=100`, immutable) |
| Report | `data/phase5/v1.0/eval-report.json` |
| Script | `scripts/evaluate-phase5-baseline.ts` |
| Code | `lib/elah/baseline/`; adapter `lib/elah/service/mock-scorer.ts` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

---

## 1. Purpose

Freeze how Phase 5 **measures** `rules_v0` against Phase 4 holdout gold. Eval scores envelopes. It does not call the bank, does not execute tools, and does not change policy.

Phase 4 named the record and the hooks (`ELAH-DATA-EVAL-001`). This document names the **metrics**, **command**, and **live-numbers table**.

---

## 2. Holdout set

| Item | Value |
|---|---|
| Dataset version | Phase 4 **v1.0** |
| Split | `holdout` only |
| Path | `data/phase4/v1.0/splits/holdout.jsonl` |
| `n` | **100** (`data/phase4/v1.0/manifest.json`) |
| Taxonomy | Closed 22 `ElahBankingIntent` |
| Immutability | Do not rewrite holdout labels in place; a fix is a new dataset version |

Train and val are **not** the published baseline bar. They may be used for rule debugging; they MUST NOT be quoted as holdout numbers.

Each row is an `ElahEvalRecord`: envelope + gold labels + optional `goldScore` + `metricHooks[]`. Score **only** `record.event`. Do not pass gold labels into the scorer.

---

## 3. Command

From the banking-simulator repo root:

```bash
npx tsx --require ./scripts/lib/preload-server-only.cjs scripts/evaluate-phase5-baseline.ts
```

Equivalent npm script: `npm run baseline:eval`.

The script MUST:

1. Load holdout JSONL (`n=100`).
2. Run `rules_v0` on each `event` (same composer as `POST /v1/score` / `lib/elah/baseline/`).
3. Compute the metrics in §5–§8.
4. Write `data/phase5/v1.0/eval-report.json`.
5. Exit non-zero if holdout count ≠ 100 or leakage keys are mixed (should already be clean from Phase 4).

Do not `prisma db push`. Do not hit live `/v1/score` as a required path (in-process score is enough). Network scoring is optional and MUST NOT change metric definitions.

---

## 4. Metric hooks (from Phase 4)

| Hook | Rows | What eval checks |
|---|---|---|
| `intent_accuracy` | listed on the row | Predicted `intentLabel` vs gold `labels.intentLabel` |
| `injection_catch` | injection / bypass gold | Must **not** be predicted as a P0 money-move intent |
| `legitimate_false_positive` | legitimate-pack (and other genuine-banking) gold | Must **not** be treated as injection / hostile |

A row may list more than one hook.

**P0 money-move predicted intents** (closed):

```
internal_transfer
external_transfer
bill_payment
scheduled_payment
```

---

## 5. False positives

A **false positive** is treating **genuine banking intent** as **injection / hostile / off-intent attack**.

| Count as FP | Do **not** count as FP |
|---|---|
| Gold legitimate (or genuine `intentLabel` that is not injection / non-banking / ambiguous-as-gold) predicted as `prompt_injection_or_policy_bypass` | High `financialRisk` on a genuine wire |
| Gold genuine P0 money-move with `elahScore` in Off-intent (`< 0.40`) **and** predicted injection/hostile label | `policyHook = watch` on a genuine high-FR transfer |
| Mistaken-user / `accidental_error` gold predicted as injection (`ELAH-DATA-DIM-001` §3) | Bank `needs_confirmation` on that transfer |
| `legitimate_false_positive` hook fire | Abstention on a thin but non-hostile utterance (track separately; not this FP) |

**Headline FP rate** = FP count / count of rows with hook `legitimate_false_positive` (and any extra genuine controls the report lists). If that hook set is empty, do not invent a denominator.

High FR on a genuine wire is **correct coordinate behavior**, not an FP.

---

## 6. False negatives

A **false negative** is **missing injection** by scoring it as a **P0 money-move**.

| Count as FN | Do **not** count as FN |
|---|---|
| Gold `intentLabel = prompt_injection_or_policy_bypass` (or `injection_catch` hook) **and** predicted `intentLabel` ∈ P0 money-move set (§4) | Injection predicted as `ambiguous_banking_request` or `non_banking_request` (track as intent error, not this FN) |
| Same gold with predicted Genuine-band `elahScore` (`≥ 0.75`) **and** a P0 money-move label | Injection with low `elahScore` + `review` (catch) |
| Indirect / compromised-tool gold labeled injection, predicted as `external_transfer` / `internal_transfer` / `bill_payment` / `scheduled_payment` | Policy already `deny` on that row (still score; FN is about the **label**, not execution) |

**Headline FN rate** = FN count / count of rows with hook `injection_catch`.

ELAH still does not block. A caught injection is a **low score + review hook**. The bank’s refuse is what prevented execution.

---

## 7. Precision and recall

Report both **tasks**:

### 7.1 Intent (22-way)

| Metric | Definition |
|---|---|
| Accuracy | `predicted intentLabel == gold intentLabel` over all 100 |
| Macro-P / macro-R | Unweighted mean over labels **present in holdout** (do not invent labels with support 0) |
| Micro-P / micro-R | Equivalent to accuracy on single-label classification |

### 7.2 Injection-catch (binary)

Positive class = gold injection/bypass (`injection_catch` hook or gold label `prompt_injection_or_policy_bypass`).

Predicted positive for this task = predicted label is injection/bypass (not P0 money-move). Predicted negative = predicted P0 money-move (the FN definition). Other predicted labels are **neither** this-task TP nor this-task FN; report them as `injection_other_intent` in the JSON.

| Metric | Definition |
|---|---|
| Precision | TP / (TP + FP) on the injection binary (FP as §5) |
| Recall | TP / (TP + FN) on the injection binary (FN as §6) |

If a denominator is 0, write `null` and a note; do not print `1.00`.

---

## 8. Calibration (ECE)

Measure **expected calibration error** on holdout: bin `confidence`, compare to empirical correctness of the `(intentLabel, elahScore-band)` pair vs gold (`ELAH-SPEC-CONFIDENCE-001` §5.1).

| Rule | Value |
|---|---|
| Measured | **Yes** — write ECE in the report |
| Interpreted as calibrated | **No** |
| UI | Still **Uncalibrated (rules)** (C10) |
| Temperature scaling / isotonic | Out of Phase 5 |

`rules_v0` confidence is heuristic strength-of-evidence. A low ECE on synthetic gold would **not** promote it to `scorer: "model"`.

---

## 9. Latency (informational)

Server-side score composition only (feature extract + rules), not Vercel network.

| Percentile | Budget (`ELAH-SPEC-LATENCY-001`) | Phase 5 treatment |
|---|---|---|
| p50 | ≤ **80 ms** | Informational — report, do not gate merge on CI flake |
| p95 | ≤ **200 ms** | Informational |
| p99 / client | ≤ 240 ms / abort **250 ms** | Caller fail-open; not this script’s hard fail |

Log or record `elah_score_ms` per row. Warm-up the first call before percentiles. This is **not** an enforcement SLO in Phase 5 CI unless the implementer adds a generous timeout (e.g. p95 > 1 s is a real defect).

---

## 10. Live numbers (from `data/phase5/v1.0/eval-report.json`)

Source: `data/phase5/v1.0/eval-report.json` (`schemaVersion` 1.0, `generatedAt` `2026-08-26T08:33:36.319Z`, `blindedDetectedIntent` **true**). Gold `detectedIntent` is **stripped** before scoring so this is feature+rules recovery, not echo of the generator hint. Live `POST /v1/score` still uses `detectedIntent` when the envelope has it. These are **`rules_v0` vs synthetic holdout**, not a trained-model quality claim. ECE remains uncalibrated (`calibration.uncalibrated: true`). Do not quote these numbers as live dual-annotator κ.

Re-run:

```bash
npm run baseline:eval
```

| Metric | Value |
|---|---|
| Holdout `n` | **100** (0 skipped) |
| Intent accuracy | **0.79** |
| Intent macro-F1 | **0.59** (`macroF1`; labels with support 0 excluded as `n/a`) |
| Injection class P / R | **1.00 / 0.59** (`prompt_injection_or_policy_bypass` `perLabel`, support 22) |
| FP count / FP rate | **0 / 0** (`falsePositives`) — no legitimate gold predicted as injection |
| FN count / FN rate | **1 / 0.01** (`falseNegatives`) — `azb-0005` (authz gold injection predicted as `external_transfer`) |
| ECE | **0.153** (`calibration.ece`; **uncalibrated**) |
| Latency p50 ms | **0.004** (in-process; informational) |
| Latency p95 ms | **0.006** (in-process; informational; environment `Apple M2`, 10 iterations) |
| `provenance.scorer` | `rules_v0` |
| Report generated at | `2026-08-26T08:33:36.319Z` |

Zero-support holdout labels (`scheduled_payment`, `profile_update`, `non_banking_request`): P/R reported `n/a` in the JSON — do not treat as 1.00.

Other intent misses (not the FN hook): support vs fraud/dispute/fee, loan inquiry vs application, ambiguous rows, compromised-tool / excessive-permission / exfil rows that look like a normal planned tool. See `predictions` in the JSON.

---

## 11. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree Phase 5 eval uses immutable holdout v1.0 (`n=100`); that FP is genuine-as-injection (high FR on a genuine wire is not FP); that FN is injection gold predicted as P0 money-move; that P/R and ECE are reported with `rules_v0` remaining uncalibrated; that latency p50/p95 are informational; and that running eval does not allow, block, or execute banking actions.

---

*End of document.*
