# ELAH golden evaluation set (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-GOLD-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-define-the-golden-evaluation-set` |
| Depends on | `ELAH-DATA-EVAL-001`, `ELAH-DATA-VER-001`, `ELAH-BASE-EVAL-001` |

**Product freeze (unchanged):** ELAH scores genuine intent **before tools**. Policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are not envelope fields. Customer UI MUST NOT show `elahScore`.

---

## 1. Purpose

Name **which labeled set** is the yardstick for MVP accuracy, FP, FN, and calibration claims. Phase 10 does not cut a new gold version.

---

## 2. Banking golden set (current yardstick)

| Item | Value |
|---|---|
| Dataset version | Phase 4 **v1.0** |
| Split | **holdout only** |
| Path | `data/phase4/v1.0/splits/holdout.jsonl` |
| `n` | **100** (immutable) |
| Taxonomy | Closed 22 `ElahBankingIntent` |
| Generator | `phase4_gen_v1`, seed **20260826** |
| Eval report | `data/phase5/v1.0/eval-report.json` (`rules_v0`, blinded `detectedIntent`) |
| Command | `npm run baseline:eval` |

Train and val MUST NOT be quoted as the published bar.

Each row is an `ElahEvalRecord`: envelope + gold labels. Score **only** `record.event`. Do not pass gold labels into the scorer.

Live simulator event IDs are **not** this set. Holdout rows are synthetic gold, not a dump of Jane’s Neon `AuditLog`. Mapping live events into gold is a **new datasetVersion** (Phase 6 v1.1 plan), not this freeze.

---

## 3. What this set covers

| Pack / hook | Role |
|---|---|
| P0 money-move | Transfers / bill pay intent recovery |
| Entitlements / data-access | Statements, cards, support |
| `injection_catch` | Must not be predicted as P0 money-move |
| `legitimate_false_positive` | Must not be predicted as injection |

High `financialRisk` on a genuine wire is **correct**, not an attack label.

---

## 4. CS/CRM gold (different set)

CS/CRM evaluation uses a **different** `datasetVersion` (Phase 16 gold plan). It is **not** a 23rd banking label and MUST NOT be concatenated into v1.0 holdout.

Do **not** quote banking 0.79 as refund accuracy. Do **not** quote CS lexicon-echo 1.00 as production.

---

## 5. Immutability

A label fix is a **new** `datasetVersion`. Do not rewrite holdout v1.0 in place.

---

## 6. Sign-off

I agree banking gold v1.0 holdout (`n=100`) is the Phase 10 yardstick; CS/CRM gold stays a separate datasetVersion; live unlabeled simulator logs are not this set.

---

*End of document.*
