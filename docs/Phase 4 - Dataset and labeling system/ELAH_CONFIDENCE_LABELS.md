# ELAH Confidence Labels (annotator)

| Field | Value |
|---|---|
| Document ID | ELAH-DATA-ANN-CONF-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 26 August 2026 |
| Related tasks | `task-4-define-confidence-labels` |
| Depends on | `ELAH-SPEC-CONFIDENCE-001`, `ELAH-DATA-TRAIN-001` |

**Product freeze (unchanged):** ELAH scores genuine banking intent before tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Low annotator confidence does **not** change bank policy. Jane / customer UI MUST NOT show `elahScore`, annotator confidence, or scorer confidence (`ELAH-SPEC-CONFIDENCE-001` C11).

---

## 1. Two different numbers

| Field | Who | Meaning |
|---|---|---|
| `labels.annotatorConfidence` / `annotatorConfidenceNumeric` | Human annotator | How sure the human is of **`intentLabel`** |
| `goldScore.confidence` or live `ScoreResponse.score.confidence` | Scorer | How sure ELAH is of the **`(elahScore, intentLabel)` pair** |

Do not overload `score.confidence` with annotator self-rating (`ELAH-SPEC-CONFIDENCE-001`). Prisma `ElahTrainingEvent.labelConfidence` is a live heuristic column; gold JSONL stores both the enum and the numeric annotator fields.

---

## 2. Annotator enum and numeric bands

`AnnotatorConfidence` = `high` \| `medium` \| `low`.

Display bands (same cut-points as scorer UI bands C5; **not** written as live API score fields):

| Enum | Numeric |
|---|---|
| `high` | ≥ 0.75 |
| `medium` | [0.40, 0.75) |
| `low` | < 0.40 |

Gold export stores **both** the enum and `annotatorConfidenceNumeric` in `[0, 1]`.

| Situation | Typical band |
|---|---|
| Clear planned tool + matching utterance | `high` |
| Two plausible banking intents, weak evidence | `medium` |
| `ambiguous_banking_request` | `low` or `medium` |

---

## 3. What confidence does not do

- Does not allow, deny, confirm, or execute.
- Does not move `event.policy`.
- Does not appear on Jane’s `/assistant`.
- Low annotator confidence is a **labeling** signal (review / IAA), not a policy engine.

---

## 4. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Data |  |  |  |
| Model |  |  |  |

**Approval statement:** I agree that annotator confidence is distinct from scorer confidence; that bands are high ≥ 0.75, medium [0.40, 0.75), low < 0.40; that both enum and numeric are stored on gold rows; and that neither number is shown to Jane or used by ELAH to allow, block, or execute.

---

*End of document.*
