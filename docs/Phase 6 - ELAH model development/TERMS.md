# ELAH model terms — founder study guide

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-TERMS-001 |
| Version | **1.0** |
| Date | 31 August 2026 |
| Audience | Founder (non-engineering). Copy this page into Confluence as-is. |
| Status | Glossary only. Does not train, score, or change the live bank. |

**How to use this in Confluence:** paste the whole file. Keep the headings. Search the A–Z list at the bottom when a memo uses a word you do not know. Numbers in this page are **our** numbers from Phase 6 (31 August 2026), not industry averages.

---

## 1. The product in four sentences

ELAH looks at a banking assistant event **before a tool runs** and guesses **what the customer genuinely intended** (pay a bill, check a balance, and so on).

The **bank’s policy engine** then decides allow / deny / confirm. **ELAH never allows, blocks, or executes.**

**Jane** (the customer) must never see an ELAH score. Scores are not stored as fields on the event itself.

Today the **live** customer path still uses handwritten **rules** (`rules_v0`). The **trained** model (`catboost_v0`) exists **offline** for study. It is not plugged into the live score API until you explicitly say so.

---

## 2. Cheat sheet — our numbers (what to remember)

Read this table first. Then use the glossary when a memo repeats a word.

| You will see | What it means in plain English | Our number | Do not read it as |
|---|---|---|---|
| Holdout accuracy **0.90** | On 100 hidden test stories, CatBoost picked the right intent 90 times | Offline CatBoost | “The live bank is 90% correct” — live is still rules |
| Rules accuracy **0.79** | Same 100 stories, the live rules picked the right intent 79 times | Live scorer | A trained model |
| **FP 0** | Never called a genuine customer an attacker (on this test) | Both systems, this slice | “We cannot make that mistake in production” |
| **FN 0** (CatBoost) / **FN 1** (rules) | CatBoost never treated an injection as a money-move; rules did once (`azb-0005`) | This synthetic test | A real red team |
| Injection recall **1.0** (22/22) | CatBoost labelled all 22 synthetic injection stories as injection | Offline, synthetic | Production 100% security |
| ECE **0.042** → **0.032** | After Platt, “I’m 80% sure” is a bit closer to being right 80% of the time | Offline only | Jane-visible confidence |
| p95 **2.16 ms** | 95% of in-process scores finished in ~2 milliseconds | This Mac, not the network | The live HTTP speed |
| Budget **80 / 200 / 250 ms** | Targets: typical ≤ 80, slow cases ≤ 200, give up at 250 | Frozen product rule | Something we raised |
| Gold **v1.0** 571 rows | The labelled practice exam (393 train / 78 val / 100 holdout) | Synthetic stories | Live bank logs |
| Model size **~4.15 MiB** | The trained file is small enough for a laptop CPU | `model.cbm` | An LLM |

**n=100 is thin.** One hundred test stories is a small exam. A few lucky or unlucky rows move the percentage a lot. We still use it because it is the **protected** exam we promised not to study ahead of time.

---

## 3. Who does what (ELAH vs the bank)

| Term | Plain English |
|---|---|
| **ELAH** | The scorer. It names genuine banking **intent**. It does not move money. |
| **Bank policy** | The bank’s own allow / deny / confirm rules. They consume ELAH’s hint; they own the decision. |
| **Jane** | Customer-facing banking UI. Must **never** show `elahScore`, confidence, or “ELAH blocked this.” |
| **Founder / security admin** | Internal people who may see scores on admin screens for evaluation. |
| **Tool** | An action the assistant wants to run (`create_internal_transfer`, `get_account_balance`, …). ELAH scores **before** that runs. |
| **Allow / deny / confirm / execute** | Bank verbs. **ELAH never does these.** |

If a memo says “the model was wrong,” that means **the intent label was wrong**, not “ELAH froze the account.”

---

## 4. The two scorers (this is the most important distinction)

| Term | Plain English | Live today? |
|---|---|---|
| **`rules_v0`** | A handwritten checklist: if these facts, then this intent. Not “trained.” Deterministic (same input → same output). | **Yes.** This is `POST /v1/score`. |
| **`catboost_v0`** | A **trained** model that learned patterns from labelled stories. First trained head. | **No.** Offline only. |
| **`modelVersion = null`** | Live responses currently say “no trained model was used.” | Yes, on the live path |
| **Cutover** | The founder decision to make CatBoost (or a hybrid) the live scorer. | **Not done.** Needs your explicit yes. |
| **Hybrid overlay** | Run rules **first**, then optionally run CatBoost as a **second** score for founder/eval, only if time remains. Overlay is **not** a second allow/deny and not shown to Jane. | Spec ready. Not wired live. |
| **`POST /v1/score`** | The live HTTP door the bank simulator knocks on to get a score. | Still rules |

**Offline** means: we ran the model on a laptop against saved files. **Live** means: the customer path in the banking simulator.

---

## 5. Data — gold, labels, splits

Training is like studying for an exam. We must not peek at the final exam.

| Term | Plain English |
|---|---|
| **Gold / gold set** | Stories we treat as the **correct answers**. Someone (or a generator) already labelled the true intent. |
| **Synthetic gold v1.0** | Made-up but structured banking stories (`phase4_gen_v1`). **571** rows. **Not** live bank logs. Do not rewrite this folder. |
| **Simulator data** | Events the banking **simulator** actually produced while Jane/admin used the demo. Different flavour than synthetic gold. |
| **Label / `intentLabel`** | The correct intent name for that story, from a **closed list of 22** (Approved 26 August 2026). Examples: `bill_payment`, `internal_transfer`, `prompt_injection_or_policy_bypass`. We do not invent a 23rd class. |
| **Human gold** | A person picked the intent in the labelling UI. We have **zero** of these for simulator events today. |
| **Heuristic label** | A guess from rules or a helper, **not** gold. The ~9,137 live-table rows are this. Do not train on them as truth. |
| **Unlabeled** | The story exists, but nobody has set `intentLabel`. Cannot be used as an exam or as training truth. |
| **Dataset version** | A named snapshot of the gold files (`v1.0`, planned `v1.1`). A new version is a **new folder**, not an overwrite. |
| **v1.1** | Planned cut from **human-labelled simulator** events. **Not on disk.** No JSONL yet. |
| **Train / val / holdout** | Three piles of the same gold: **train** (learn), **val** (tune / stop), **holdout** (final exam — never study it). Ours: **393 / 78 / 100**. |
| **Protected holdout** | We promised not to train or tune on those 100 rows. We only score them **after** training. |
| **Blinded** | We hide a cheat sheet field (`detectedIntent`) so the model cannot copy the generator’s hint. |
| **Leakage** | Accidentally putting the same story-family in both “study” and “exam” (same `sequenceId` or `twinGroupId`). That makes scores look better than they are. |
| **Twins** | UI vs agent versions of the **same** customer moment. They must stay together in train **or** together in holdout — never split. Do **not** average UI and agent into one fake score. |
| **`n`** | How many rows. **n=100** means one hundred holdout stories. |
| **Pack** | A themed bundle of gold stories (e.g. `legitimate`, `prompt_injection`). |
| **Producer / consumer** | Banking repo **writes** gold; `elah-model` **reads** a copy. |

---

## 6. What the model is trying to predict

| Term | Plain English |
|---|---|
| **Intent** | Which of the 22 genuine-banking (or non-genuine) classes this event is. |
| **MultiClass** | The model picks **one** class out of many, not a yes/no fraud flag. |
| **Argmax** | “Pick the class with the largest probability.” That pick is the predicted intent. |
| **Features** | The facts we feed the model (tool name, amount bucket, odd hours, short utterance, …). Not the raw novel of the chat alone. |
| **`strip_hint` / strip `detectedIntent`** | Remove the generator’s suggested intent before scoring, so we are not testing “can you copy the hint.” |
| **CatBoost** | A **gradient-boosted tree** method. Think: many small yes/no questions combined. Good at mixed numbers + categories. **Not** ChatGPT. |
| **LLM / SLM** | Large / small language models. Rejected for the **customer path** unless they can finish inside 250 ms. We did not put one live. |
| **Baseline** | The simple thing we beat. For us, live **rules_v0** on the same holdout. |
| **Head / artifact** | The trained file (`model.cbm`) plus its metrics. `catboost_v0` is the first named head. |
| **`model.cbm`** | The CatBoost weights file (~4.3 million bytes). |

ELAH’s output is **genuine intent**, not **P(fraud)** and not **P(allow)**.

---

## 7. Scorecard words (accuracy, F1, recall)

Percentages here are **fractions of the exam**, written as 0.90 = 90%.

| Term | Plain English | Our CatBoost holdout |
|---|---|---|
| **Accuracy** | Share of stories where predicted intent = gold intent. | **0.90** (90 / 100) |
| **Error** | The other 10 stories. Wrong **label**, not a bank freeze. | 10 / 100 |
| **Precision** | When the model says class X, how often it really was X. | Used inside F1 |
| **Recall** | Of all true X stories, how many did we catch. | Injection: **22/22** synthetic (do not market as production 100%) |
| **F1** | A blend of precision and recall for one class. | — |
| **Macro-F1** | Average F1 across classes so rare classes still count. ~**0.89** CatBoost vs ~**0.59** rules. | Classes with **zero** holdout examples are skipped |
| **Support** | How many gold examples of that class are in the exam. `dispute_chargeback` had **4** — too few to trust a 0% recall as a law of nature. | Thin classes exist |
| **Bar** | The number the new model must beat (or not regress). Rules bar: accuracy **0.79**, FP **0**, FN **1**. | CatBoost beat accuracy and FN on this slice |

**Weak labels on this exam** (CatBoost often missed them because there were almost no examples): `dispute_chargeback`, `fraud_report`, `fee_or_overdraft_question`, and some `internal_transfer` / `bill_payment` mix-ups.

---

## 8. Safety hooks — FP and FN (read carefully)

In **this** project, FP and FN are **not** generic “false alarm / missed fraud.” They are two specific, named mistakes:

| Term | Plain English | Our holdout |
|---|---|---|
| **Legitimate-as-injection FP** | A **genuine** customer was labelled `prompt_injection_or_policy_bypass`. We treated a real person as an attacker. | **0** (rules and CatBoost, this slice) |
| **Injection → P0-money FN** | A gold **injection** was labelled as a **money-moving** intent (`external_transfer`, `internal_transfer`, `bill_payment`, `scheduled_payment`, `savings_optimization`). That is the scary miss. | CatBoost **0**; rules **1** (`azb-0005`) |
| **P0** | Highest-priority money-movement family in this taxonomy. Not “the bank will pay P0 incident response.” | See list above |
| **Injection** | Gold intent `prompt_injection_or_policy_bypass` (policy-bypass / prompt-injection **stories in gold**). | 22 of 100 holdout rows |

A model can have **accuracy 0.90** and still be unacceptable if FP or FN get worse. That is why we refuse a calibrator that “looks nicer” but hurts FP/FN.

---

## 9. Confidence, calibration, abstention

| Term | Plain English |
|---|---|
| **Confidence** | How strongly the model prefers its **top intent**. Here: the **largest class probability** (a number from 0 to 1). **Not** P(fraud). **Not** P(allow). Jane never sees it. |
| **`predict_proba`** | “Give me 22 probabilities that add up to 1.” The biggest one is the prediction; its size is confidence. |
| **Calibration** | When the model says “80% sure,” it should be right about 80% of those times. Uncalibrated models are often over- or under-confident. |
| **ECE (Expected Calibration Error)** | How far those “I’m X% sure” claims are from reality. **Lower is better.** | Uncalibrated CatBoost **0.042**; after Platt **0.032**; live rules **0.153**. Holdout is thin. |
| **Uncalibrated** | Using the raw probabilities with no extra adjustment. Live `rules_v0` is uncalibrated. |
| **Platt scaling** | A simple curve fitted on **val** that maps “raw confidence” → “better-matched confidence.” We applied this **offline only**. It did **not** change which intent was picked (argmax stayed the same). |
| **Temperature scaling** | Divide the model’s logits by a temperature T to sharpen or soften probabilities. Small ECE drop here; we treated it as noise. |
| **Isotonic regression** | A flexible staircase fit. It **overfit** our tiny val set (78 rows). We **discarded** it even though holdout ECE looked pretty. |
| **Fit on val, score on holdout** | Learn the calibrator on the 78 tuning rows; **never** on the 100 exam rows. Fitting on the exam is cheating. |
| **Abstention** | “Do not treat this score as decisive” (`status = abstained`). **Not** a deny. **Not** a freeze. Jane still must not see it. |
| **Fail-open / skip** | If scoring cannot finish in **250 ms**, skip rather than wait or invent a number. That is `scoring_unavailable`, **not** abstention. |
| **C5 bands** | Display copy: low &lt; 0.40, high ≥ 0.75. Analysis-only. Not API fields. |

---

## 10. Speed and size

| Term | Plain English | Ours |
|---|---|---|
| **Latency** | How long one score takes. | — |
| **Millisecond (ms)** | 1/1000 of a second. 2 ms is very fast on a laptop. | — |
| **p50 / p95 / p99** | Sort all timings. p50 = typical (half are faster). p95 = slow-ish (only 5% slower). p99 = almost worst. | Extract+predict p50 **0.176 ms**, p95 **2.16 ms** |
| **In-process** | Model runs **inside the same program**, no network hop. | What we measured |
| **HTTP / colocated p95** | Time including the network request to `/v1/score`. **Not measured** for CatBoost. Do not treat the laptop number as a production SLO. | Still a later bar |
| **Throughput** | How many events per second. | ~**1,579**/sec extract+predict sequential; ~**50,979**/sec in batches of 32 |
| **Budget 80 / 200 / 250** | Product freeze: typical ≤ 80 ms, p95 ≤ 200 ms, **abort at 250 ms**. We do **not** raise 250. | In-process CatBoost is **inside** 80/200. That does **not** cut over live HTTP. |
| **Lightweight** | Small file, CPU-friendly. | **~4.15 MiB** |

---

## 11. Robustness (stress, not a red team)

| Term | Plain English |
|---|---|
| **Missing context** | A field was empty (no utterance, no tool name, no amount). Treated as **unknown**, **not** as an attack. |
| **Noisy context** | We flipped or jittered a feature (odd hours, short utterance, amount bucket) on a **copy** of holdout. Gold files were **not** rewritten. |
| **Adversarial-gold** | We scored the **existing synthetic injection packs**. **Not** a red team. **Not** exploit writing. **Not** production. |
| **Robustness** | “Does the scorecard fall apart if the event is incomplete or slightly messy?” On this slice, FP/FN stayed 0; dropping amount missed one injection label (not a P0-money FN). |

---

## 12. Versioning, experiments, rollback

| Term | Plain English |
|---|---|
| **`modelVersion`** | A name for a trained snapshot, e.g. `catboost_v0`. Live path still sends **null**. |
| **Immutable version directory** | `artifacts/versions/catboost_v0/` is not overwritten when we train again. The next train becomes `catboost_v1`. |
| **`current.json`** | A **pointer**: “offline default is this version.” Changing the pointer is **not** changing live `/v1/score`. |
| **Experiment log** | `experiments.jsonl` — one line per train, never edited in place. Not MLflow (a heavyweight experiment product we did not install). |
| **Rollback (offline)** | Point `current` back at `catboost_v0` and re-eval. **Live** rollback would mean “keep serving rules”; we never switched live off rules. |
| **sha256** | A fingerprint of the `model.cbm` file so we know the bytes did not change. |

---

## 13. Documents and IDs you will see

Memos have IDs like `ELAH-MDL-LAT-001`. **MDL** = model. The number is just a catalogue tag.

| ID (short) | Topic |
|---|---|
| CARD | What is live vs what was trained (model card) |
| RUN | The training run record |
| ERR | Where the model was wrong, by intent / tool / source |
| CONF / CAL | Confidence and calibration |
| ROB | Robustness |
| LAT | Speed and throughput |
| VER | Versioning and offline rollback |
| HYB | Hybrid overlay spec (prepare, do not cut over) |
| DATA / DATA-V11 | Gold v1.0 vs planned v1.1 |
| ABS | Abstention ≠ deny |
| LIMIT | What we must not claim |

---

## 14. Phrases that are easy to over-claim

| If you hear | Safer reading |
|---|---|
| “90% accurate” | On **100 synthetic holdout** stories, **offline**, with the cheat-sheet field stripped. Live is still **79%** rules. |
| “Zero false positives” | On **this** exam’s definition of FP. Not a lifetime warranty. |
| “100% injection recall” | **22/22 synthetic** holdout rows. Not a pentest. Not production. |
| “Faster than 200 ms” | **In-process on this Mac.** Not the live HTTP path. |
| “We integrated the model” | We **wrote the spec** and measured latency. We did **not** change the live scorer. |
| “We trained on simulator data” | We **planned** v1.1. Labelled simulator gold = **0**. |
| “Calibrated” | Platt file next to the **offline** model. Live rules are still **uncalibrated**. Jane still sees nothing. |

---

## 15. A–Z index

**A** — Accuracy; Argmax; Artifact; Abstention; Adversarial-gold  
**B** — Baseline; Bar; Blinded; Budget (80/200/250)  
**C** — Calibration; CatBoost; Confidence; Cutover; `catboost_v0`; Current pointer  
**D** — Dataset version; `detectedIntent` (stripped)  
**E** — ECE; Error analysis; Execute (ELAH never does this)  
**F** — Fail-open; Features; F1 / macro-F1; FP (legitimate-as-injection); FN (injection→P0-money)  
**G** — Gold; Gradient-boosted trees  
**H** — Head; Heuristic; Holdout; Hybrid overlay; HTTP p95  
**I** — Intent; Injection; In-process; Isotonic (discarded)  
**J** — Jane (never sees scores)  
**L** — Label; Latency; Leakage; LLM (not on customer path)  
**M** — Macro-F1; `model.cbm`; `modelVersion`; MultiClass; Missing context  
**N** — n (count); Noisy context  
**O** — Offline vs live; Overlay  
**P** — p50/p95; P0 money-movement; Platt; Precision; `predict_proba`; Protected holdout  
**R** — Recall; Red team (we did **not** do one); Rollback; `rules_v0`; Robustness  
**S** — sha256; Simulator; Split; Support; Synthetic; ScoreResponse  
**T** — Taxonomy (closed 22); Temperature scaling; Thin (n=100); Throughput; Train/val/holdout; Twins  
**U** — Uncalibrated; Unlabeled  
**V** — val; v1.0; v1.1 (planned)  

---

## 16. Sign-off

This page teaches vocabulary. It does not cut over `POST /v1/score`. It does not claim production metrics. **ELAH never allows, blocks, or executes.**

---

*End of document.*
