# ELAH Model Latency — in-process `catboost_v0`

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-LAT-001 |
| Version | **1.0** |
| Status | **Recorded** — in-process on this Mac; **not** live HTTP |
| Date | 31 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-6-test-inference-speed`, `task-6-test-throughput` |
| Training home | `/Users/benda/elah-model` |
| Code | `elah_model/bench.py` |
| Artifact | `artifacts/catboost_v0/latency.json` |
| Metrics block | `artifacts/catboost_v0/metrics.json` → `latency` |
| Depends on | `ELAH-SPEC-LATENCY-001`, `ELAH-MDL-ARCH-001`, `ELAH-MDL-RUN-001` |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. Live `POST /v1/score` remains `rules_v0`. This measurement does **not** change the live scorer and does **not** raise the 250 ms fail-open.

**What this is:** in-process CatBoost `extract_features` + `predict` on gold v1.0 holdout, on this Mac (`darwin` / Darwin 22.1.0 / arm64). **What this is not:** colocated HTTP p95, a live `/v1/score` SLO, or a cutover.

---

## 1. Purpose

Measure whether offline `catboost_v0` can finish inside the frozen latency budget **in process**, and record sequential plus batch throughput. The job is measure, not wire the bank.

---

## 2. Budget (restate; do not change)

From `ELAH-SPEC-LATENCY-001` (`docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_LATENCY.md`):

| Percentile | Target | Hard ceiling |
|---|---|---|
| p50 | **≤ 80 ms** | — |
| p95 | **≤ 200 ms** | — |
| p99 | **≤ 240 ms** | Client abort at **250 ms** |

Client fail-open stays **250 ms**. If inference cannot finish, **fail-open / skip** (`scoring_unavailable`) — never wait, never invent a score, never block the tool. This document does **not** revise those numbers.

---

## 3. Method

| Item | Value |
|---|---|
| Model | `artifacts/catboost_v0/model.cbm` |
| Events | gold v1.0 `holdout.jsonl` (**n=100**, protected; eval only) |
| Encoder | `elah_model.features.extract_features` (`strip_hint=True`) |
| Warmup | **100** (extract+predict and predict-only) |
| Latency iterations | **2000** (cycle holdout) |
| Timer | `time.perf_counter` |
| Threads | CatBoost `thread_count=1` (one-event serving analogue) |
| Machine | **darwin** (`sys.platform`); Darwin 22.1.0; arm64; Python 3.13.5 |
| Measured at | `2026-08-31T10:57:19.349589+00:00` |

**(a) Predict only:** pre-extracted features, pre-built 1-row `Pool`, time `model.predict` only.

**(b) Extract+predict:** `extract_features` + 1-row `Pool` + `model.predict`. This is the in-process unit that would sit on a future customer path.

Throughput:

- Sequential predict: 5000 one-row `predict` calls.
- Sequential extract+predict: 5000 extract+Pool+predict calls.
- Batch/pool predict: CatBoost `Pool` of **batch size 32**, 200 repeats (6400 events).

Reproduce:

```bash
cd /Users/benda/elah-model
source .venv/bin/activate
python -m elah_model.bench
```

Does not call the bank. Does not write `POST /v1/score`. `train.py` is unchanged; the bench **appends** a `latency` block to existing `metrics.json`.

---

## 4. Numbers (in-process, this Mac)

Source: `artifacts/catboost_v0/latency.json`. Milliseconds unless noted.

### 4.1 Latency

| Path | p50 | p95 | p99 | mean | max |
|---|---:|---:|---:|---:|---:|
| Predict only | **0.0985** | **0.4906** | **3.75** | 0.357 | 64.3 |
| Extract+predict | **0.176** | **2.16** | **8.11** | 0.647 | 45.3 |

Headline for the budget: **extract+predict p50 = 0.176 ms, p95 = 2.16 ms**.

Informational: live `rules_v0` in-process p50/p95 was **0.004 / 0.006 ms** (Apple M2, 10 iterations, Phase 5). CatBoost is slower and still far inside the ceiling. Do not treat either figure as colocated HTTP p95.

### 4.2 Throughput

| Mode | Events/sec | Notes |
|---|---:|---|
| Sequential predict | **2,480** | 5000 one-row `Pool` predicts |
| Sequential extract+predict | **1,579** | 5000 extract + Pool + predict |
| Batch/pool predict | **50,979** | **batch size 32**, 200 repeats |

Batch throughput is **not** the customer-path unit. Live scoring is one `ElahEvent` per `POST /v1/score`. Quote sequential extract+predict for serving capacity on this machine.

---

## 5. Comparison to 80 / 200 / 250

| Check | Budget | Extract+predict | Holds? |
|---|---|---|---|
| p50 | ≤ **80 ms** | **0.176 ms** | **Yes** |
| p95 | ≤ **200 ms** | **2.16 ms** | **Yes** |
| p99 / client abort | ≤ 240 ms / fail-open **250 ms** | p99 **8.11 ms**; max **45.3 ms** | **Yes** (in-process) |

`holdsP95`: **true**. Fail-open remains **250 ms** (unchanged). Live scorer remains `rules_v0`. `wiredToLiveScore`: **false**.

This is **not** colocated HTTP p95. Network, auth, schema, persist, and Node adapter time are **not** in these numbers. Item 5 of `ELAH-MDL-ARCH-001` still requires colocated HTTP p95 **before** any live cutover.

---

## 6. Hybrid implication

In-process extract+predict **p95 ≤ 200 ms** holds on this Mac (2.16 ms vs 200 ms). A hybrid overlay (rules first, CatBoost on remaining budget) is **latency-feasible in-process**. Per founder direction: **prepare** that hybrid (rules first, CatBoost overlay) but **do not** cut over live `POST /v1/score` until the founder says so. Live provenance stays `scorer = rules_v0`, `modelVersion = null`. Do not raise 250 ms. Do not treat this memo as HTTP evidence. If a later colocated HTTP measurement missed p95, keep `rules_v0` only on the customer path.

---

## 7. What this pass did not do

- Did not modify `lib/elah/service/mock-scorer.ts` or `POST /v1/score`
- Did not raise the 250 ms client fail-open
- Did not claim colocated HTTP p95
- Did not set `provenance.scorer = model` or `hybrid`
- Did not integrate CatBoost into the banking app
- Did not change Jane’s UI, bank policy, or Prisma

---

## 8. Related documents

| Document | Role |
|---|---|
| `docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_LATENCY.md` | Frozen 80 / 200 / 250 |
| [ELAH_MODEL_ARCHITECTURE.md](./ELAH_MODEL_ARCHITECTURE.md) | Promotion bar; p95 still required on HTTP before cutover |
| [ELAH_MODEL_APPROACH_COMPARISON.md](./ELAH_MODEL_APPROACH_COMPARISON.md) | Hybrid as serving pattern |
| [ELAH_MODEL_TRAINING_RUN.md](./ELAH_MODEL_TRAINING_RUN.md) | Offline `catboost_v0` fit |
| [ELAH_MODEL_ABSTENTION.md](./ELAH_MODEL_ABSTENTION.md) | Miss 250 ms → fail-open / skip, not a block |

---

## 9. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Engineering |  |  |  |
| Security |  |  |  |

**Approval statement:** I agree these numbers are **in-process CatBoost on this Mac (darwin)**, not colocated HTTP p95 and not a live `/v1/score` claim; that the budget remains p50 ≤ 80 ms, p95 ≤ 200 ms, client fail-open **250 ms** (unchanged); that extract+predict p50 / p95 **0.176 / 2.16 ms** holds that in-process bar; that a hybrid overlay is therefore **latency-feasible in-process** and may be **prepared** (rules first, CatBoost overlay) but **must not** cut over live `POST /v1/score` until the founder says so; that live scoring stays `rules_v0`; and that ELAH never allows, blocks, or executes.

---

*End of document.*
