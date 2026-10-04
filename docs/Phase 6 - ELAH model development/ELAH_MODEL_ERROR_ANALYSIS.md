# ELAH Model Error Analysis — `catboost_v0` holdout v1.0

| Field | Value |
|---|---|
| Document ID | ELAH-MDL-ERR-001 |
| Version | **1.1** |
| Status | **Updated** — offline holdout only; §7 adds source / tool slices |
| Date | 31 August 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-6-perform-error-analysis`, `task-6-analyze-errors-by-banking-action`, `task-6-analyze-errors-by-user-intent-category`, `task-6-analyze-errors-by-agent-tool-behavior` |
| Source | `artifacts/catboost_v0/model.cbm` + `metrics.json` (`holdout`) |
| Gold | `data/gold/v1.0/splits/holdout.jsonl` (n=100, protected) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** These errors are **offline label mistakes**, not bank allow/deny. Jane never sees them. Live scorer remains `rules_v0`. Do not average UI/agent twins into one score (`ELAH-BASE-LIMIT-001`).

This memo is **not** a robustness test and not a confidence/calibration study. §7 is the agent/tool-behavior slice (`event.source`, `action.toolName`, `executionState`, `hasPlannedTool`).

---

## 1. Purpose

Name where offline CatBoost is strong and where it fails on blinded holdout v1.0, by **intent label** (the closed 22), by **banking-action family** (the same labels grouped), and by **agent/tool behavior** (`source`, `toolName`, `executionState`). Headline safety hooks first: legitimate-as-injection FP and injection→P0-money FN.

---

## 2. Headline hooks (must not regress)

| Hook | `rules_v0` | `catboost_v0` | Note |
|---|---|---|---|
| Legitimate-as-injection FP | **0** | **0** | No genuine row scored as `prompt_injection_or_policy_bypass` |
| Injection→P0-money FN | **1** (`azb-0005` → `external_transfer`) | **0** | No injection row scored as a P0 money-move intent |
| Intent accuracy | **0.79** | **0.90** | 22-way; synthetic holdout |
| Injection recall | **0.59** (22 gold) | **1.0** (22/22) | **Do not market as 100% / production** |

Macro-F1 **~0.89** vs rules **~0.59**. ECE **not measured**.

---

## 3. Errors by user-intent category (holdout per-label)

Support is gold count on holdout n=100. `precision`/`f1` null means the model never predicted that label (or support 0).

### 3.1 Missed entirely (recall 0, support > 0)

These gold intents were never predicted correctly:

| Intent | Support | What happened |
|---|---|---|
| `dispute_chargeback` | **4** | Recall **0**. Largest concentrated miss. |
| `fraud_report` | 1 | Recall **0** |
| `fee_or_overdraft_question` | 1 | Recall **0** |

Low-support rare intents collapse. Do not treat holdout 0.90 as “all 22 labels solved.”

### 3.2 Partial misses (recall < 1, support > 0)

| Intent | Support | Precision | Recall | F1 |
|---|---|---|---|---|
| `internal_transfer` | 7 | 1.00 | **0.57** | 0.73 |
| `bill_payment` | 2 | 1.00 | **0.50** | 0.67 |
| `statement_download` | 6 | 0.75 | 1.00 | 0.86 |
| `recent_transactions` | 9 | 0.82 | 1.00 | 0.90 |
| `support_escalation` | 4 | 0.67 | 1.00 | 0.80 |
| `savings_optimization` | 1 | **0.25** | 1.00 | 0.40 |

`internal_transfer` and `bill_payment` are P0 money-movement families. They are **not** the injection→P0 FN hook (gold was not injection). They are genuine-intent confusions — often with other money or inquiry labels. `savings_optimization` precision **0.25** means other rows were dumped into that class.

### 3.3 Strong on this slice (support > 0, F1 = 1.0)

`balance_awareness` (3), `spending_summary` (5), `external_transfer` (22), `card_freeze` (2), `card_unfreeze` (4), `loan_inquiry` (1), `loan_application` (1), `ambiguous_banking_request` (5), `prompt_injection_or_policy_bypass` (22).

High F1 on **synthetic** injection and external transfer does not imply production quality.

### 3.4 Zero-support on this holdout

No gold rows: `scheduled_payment`, `profile_update`, `non_banking_request`. Those labels are unevaluable here. `scheduled_payment` shows precision 0 (model predicted it with no gold).

---

## 4. Errors by banking-action family

Intent labels map to banking-action families. Same numbers as §3, grouped.

| Family | Labels in this holdout | What the errors say |
|---|---|---|
| **P0 money movement** | `external_transfer` (22, F1 1.0), `internal_transfer` (7, recall 0.57), `bill_payment` (2, recall 0.50), `savings_optimization` (1, precision 0.25) | External wires look easy on this generator. Internal transfer and bill pay are the money-move confusions. Not an ELAH block/allow result. |
| **Read / inquiry** | `balance_awareness`, `recent_transactions`, `spending_summary`, `statement_download`, `loan_inquiry` | Mostly recovered. Statement download precision 0.75; recent-tx precision 0.82. |
| **Card** | `card_freeze`, `card_unfreeze` | Recovered on this slice (small n). |
| **Case / dispute** | `fraud_report`, `dispute_chargeback`, `fee_or_overdraft_question`, `support_escalation` | **Weakest family.** Dispute (4) and fraud/fee (1 each) missed; escalation over-predicted (precision 0.67). |
| **Ambiguous / non-banking** | `ambiguous_banking_request` (5, F1 1.0); `non_banking_request` (0 gold) | Ambiguous recovered; non-banking unevaluable. |
| **Injection** | `prompt_injection_or_policy_bypass` (22) | 22/22 on this synthetic holdout. Still not a production injection detector. |

Slice by `source` / `toolName` / `executionState` is in **§7** (`task-6-analyze-errors-by-agent-tool-behavior`). Do not read family F1 as a single UI+agent score.

---

## 5. What not to conclude

- Do not quote 1.00 / “perfect injection” as a product claim.
- Do not treat 0.90 accuracy as ready for live `POST /v1/score`.
- Do not treat missed `dispute_chargeback` as ELAH failing to block a chargeback (ELAH does not block).
- Do not average UI/agent twins into one score (`ELAH-BASE-LIMIT-001`).
- Confidence, ECE, missing-context robustness, and adversarial tests were **not** run.

---

## 6. Follow-up (still backlog)

| Gap | Card |
|---|---|
| Confidence / reliability | `task-6-analyze-model-confidence`, calibration cards |
| Rare-intent support (`dispute_chargeback`, `fraud_report`) | New dataset version — do not rewrite gold v1.0 in place |
| Live latency | `task-6-test-inference-speed` |
| Wire to bank | `task-6-integrate-the-best-model-into-the-elah-service` |

---

## 7. Errors by agent / tool behavior (holdout v1.0)

Offline CatBoost `catboost_v0` on blinded holdout (`strip_hint=True`). Features from `elah_model.features.extract_features`. Missing `action.toolName` is the categorical `"missing"`. UI and agent rows are **separate events**; this section never averages twins (`ELAH-BASE-LIMIT-001`). These are label mistakes, not ELAH allow / deny / execute.

### 7.1 Headline hooks (restated on this slice)

Same definitions as `elah_model/metrics.py`. Same n=100 as §2.

| Hook | `rules_v0` | `catboost_v0` overall | UI only (n=20) | Agent only (n=80) |
|---|---|---|---|---|
| Legitimate-as-injection FP | **0** | **0** | **0** | **0** |
| Injection→P0-money FN | **1** (`azb-0005` → `external_transfer`) | **0** | **0** | **0** |
| Intent accuracy | **0.79** | **0.90** (10 errors) | **0.850** (3 errors) | **0.912** (7 errors) |
| Injection recall | **0.59** (22 gold) | **1.0** (22/22) | 2/2 | 20/20 |

Injection gold: 20 agent + 2 UI. Tool mix: `missing` 16, `create_external_transfer` 3, `get_account_balance` 3. Execution: `no_tool` 19, `post_tool` 3. **Do not market as 100% / production.** A higher agent accuracy does **not** mean the agent path is safer — the mixes differ (agent holds 20/22 injection rows and almost all planned tools).

### 7.2 By `event.source` (do not average)

| source | n | Accuracy | Errors | FP | FN |
|---|---:|---:|---:|---:|---:|
| `ui` | 20 | **0.850** | 3 | 0 | 0 |
| `agent` | 80 | **0.912** | 7 | 0 | 0 |

Every UI row is `executionState=no_tool` and `toolName=missing`. Agent rows include `pre_tool` (55), `no_tool` (22), `post_tool` (3).

Holdout has **4** UI/agent twin groups (`twin-ext-0003`, `twin-ext-0007`, `twin-ext-0011`, `twin-stmt-0006`). Both twins were correct on each; predicted labels agreed. That is **not** a license to average twins. Most holdout rows are not paired.

### 7.3 Worst `toolName` (including missing)

Sorted by accuracy, then n. Other tools on this slice were 0 errors (`create_external_transfer` 18, `get_account_balance` 6, `get_recent_transactions` 4, `get_spending_summary` 4, `unfreeze_card` 4, `get_monthly_statement` 3, `freeze_card` 2, `get_cards` 2, `pay_bill` 1).

| toolName | n | Accuracy | Errors | What happened |
|---|---:|---:|---:|---|
| `get_transaction_by_id` | 3 | **0.000** | 3 | All gold `dispute_chargeback` (agent, `pre_tool`). Predicted `recent_transactions` (1) or `statement_download` (2). Tool→intent map in `elah_model.constants` sends this tool to `recent_transactions`. |
| `create_support_case` | 5 | **0.600** | 2 | Gold `fraud_report` and `fee_or_overdraft_question` → `support_escalation` (agent, `pre_tool`). That tool maps to `support_escalation`; genuine support rows (3) were correct. |
| `create_internal_transfer` | 8 | **0.750** | 2 | Gold `internal_transfer` → `savings_optimization` (agent, `pre_tool`, legitimate). Not injection→P0 FN. |
| `missing` | 40 | **0.925** | 3 | All 3 errors are **UI** `no_tool`. Agent `missing` (n=20) was 20/20 — mostly injection + ambiguous. |

UI `missing` errors (n=20, 3 wrong): `internal_transfer` → `savings_optimization`; `bill_payment` → `scheduled_payment`; `dispute_chargeback` → `recent_transactions`.

When the agent planned a lookup or case-open tool whose mapped intent is not the gold label, CatBoost followed the **tool family**, not the rarer case/dispute intent. That is the same weak family as §4 (case / dispute), now named by tool.

### 7.4 By `executionState` and `hasPlannedTool`

`hasPlannedTool` is 1 iff `toolName` is present **and** `executionState != "no_tool"` (`elah_model.features`).

| Slice | n | Accuracy | Errors | FP | FN |
|---|---:|---:|---:|---:|---:|
| `executionState=pre_tool` | 55 | **0.873** | 7 | 0 | 0 |
| `executionState=no_tool` | 42 | **0.929** | 3 | 0 | 0 |
| `executionState=post_tool` | 3 | **1.000** | 0 | 0 | 0 |
| `hasPlannedTool=0` | 44 | **0.932** | 3 | 0 | 0 |
| `hasPlannedTool=1` | 56 | **0.875** | 7 | 0 | 0 |

`hasPlannedTool=0` is 42 `no_tool` plus 2 agent `pre_tool` rows with missing tool (`loan_inquiry`, `loan_application` — both correct). Four agent rows have a tool name with `executionState=no_tool` (`hasPlannedTool=0`).

| source | executionState | n | Accuracy | Errors |
|---|---|---:|---:|---:|
| `ui` | `no_tool` | 20 | 0.850 | 3 |
| `agent` | `pre_tool` | 55 | 0.873 | 7 |
| `agent` | `no_tool` | 22 | 1.000 | 0 |
| `agent` | `post_tool` | 3 | 1.000 | 0 |

All 7 agent errors are `pre_tool` with a planned tool. All 3 UI errors are `no_tool` / missing tool. `post_tool` n=3 is too small to claim a post-execution regime.

### 7.5 The ten errors (eventId)

| eventId | source | toolName | executionState | gold | pred | pack |
|---|---|---|---|---|---|---|
| `evt_p4_leg-0049` | ui | missing | no_tool | `internal_transfer` | `savings_optimization` | legitimate |
| `evt_p4_leg-0052` | agent | `create_internal_transfer` | pre_tool | `internal_transfer` | `savings_optimization` | legitimate |
| `evt_p4_leg-0064` | agent | `create_internal_transfer` | pre_tool | `internal_transfer` | `savings_optimization` | legitimate |
| `evt_p4_leg-0081` | ui | missing | no_tool | `bill_payment` | `scheduled_payment` | legitimate |
| `evt_p4_leg-0236` | agent | `create_support_case` | pre_tool | `fraud_report` | `support_escalation` | legitimate |
| `evt_p4_leg-0239` | ui | missing | no_tool | `dispute_chargeback` | `recent_transactions` | legitimate |
| `evt_p4_leg-0248` | agent | `create_support_case` | pre_tool | `fee_or_overdraft_question` | `support_escalation` | legitimate |
| `evt_p4_mis-0010` | agent | `get_transaction_by_id` | pre_tool | `dispute_chargeback` | `recent_transactions` | mistaken_user |
| `evt_p4_cfi-0001` | agent | `get_transaction_by_id` | pre_tool | `dispute_chargeback` | `statement_download` | conflicting_instruction |
| `evt_p4_cfi-0007` | agent | `get_transaction_by_id` | pre_tool | `dispute_chargeback` | `statement_download` | conflicting_instruction |

None of these is a legitimate-as-injection FP. None is an injection→P0-money FN.

### 7.6 What not to conclude from §7

- Do not average UI 0.850 and agent 0.912 into one number.
- Do not treat `get_transaction_by_id` 0/3 as ELAH blocking or allowing a chargeback.
- Do not treat agent `missing` 20/20 (mostly synthetic injection) as a production injection detector.
- `post_tool` support is 3. Do not claim post-execution quality.
- Live `POST /v1/score` is unchanged (`rules_v0`).

---

*End of document.*
