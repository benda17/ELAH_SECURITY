# ELAH Cold Email

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-MAIL-001 |
| Version | **0.1** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security (fundraising pack) |
| Owner | Founder |
| Use | Copy into the founder’s mail client. **Do not send from this repo.** |
| Placeholders | `{FirstName}` `{Firm}` `{PersonalizationFact}` |
| Ask source | Founder dashboard `FIRST_ROUND_PLAN` — **founder-approved working ask** (26 August 2026; not closed) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

**Send rules:** replace every placeholder. `{PersonalizationFact}` must be **one true sentence** the founder actually knows (a portfolio company, a talk, a paper, a public thesis). If you do not have one, do not invent one — delete the sentence. Do not attach fake bank logos. Do not claim ARR. Do not write “we block fraud.” Do not log a meeting that has not happened.

---

## 1. Master (120–180 words)

**Subject:** ELAH — scoring genuine banking intent before the assistant moves money

**Word count (body, excluding subject / sign-off name):** 150

```
{FirstName} —

{PersonalizationFact}

Banks are putting assistants on transfer, bill-pay, and card tools. Auth, limits, and confirm dialogs still do not score whether the request looks like genuine customer intent.

ELAH is a pre-tool scoring service for authenticated banking assistants. It returns an intention score, a closed intent label, and three coordinates (Human Agency, Financial Risk, Emotional Urgency). The bank’s policy still allow / deny / confirm. ELAH never allows, blocks, or executes. The customer never sees the score.

What exists, on a live simulator (not a production bank): POST /v1/score with provenance rules_v0; gold dataset v1.0 — 571 rows, holdout 100, seed 20260826; blinded holdout intent accuracy 0.79, legitimate-as-injection FP 0, FN 1, injection recall 0.59, ECE 0.153 uncalibrated. rules_v0 is not a trained model. Do not quote 1.00 — that was hint-echo.

Raising $400K pre-seed for 12 months. Happy to walk Jane’s transfer + injection path live.

Best,
[Founder]
```

---

## 2. How to use variants

Keep the freeze and the numbers identical. Change only the **opening frame** (one extra sentence after `{PersonalizationFact}`) and the **close**. Do not add traction. Do not name banks. `{Firm}` appears in the subject or first line so the founder notices a missed merge.

---

## 3. Variant — AI-agent investor

**Subject:** {Firm} / agent runtime: intention score before tool execution

```
{FirstName} —

{PersonalizationFact}

Most agent stacks gate tools with policy and prompt filters. They still do not score whether an authenticated banking request looks like a chosen customer act.

ELAH sits after bank policy and before executeTool: POST /v1/score, provenance rules_v0. The bank still allow / deny / confirm. ELAH never allows, blocks, or executes. Jane never sees elahScore.

Live simulator MVP (not a production bank). Gold v1.0: 571 rows, holdout 100, seed 20260826. Blinded holdout: intent accuracy 0.79, legitimate-as-injection FP 0, FN 1, injection recall 0.59, ECE 0.153 uncalibrated. Not a trained model; 1.00 accuracy was hint-echo.

$400K pre-seed / 12 months. I can show the Jane transfer + injection path in 12 minutes.

Best,
[Founder]
```

---

## 4. Variant — Cyber / SOC investor

**Subject:** {Firm} — SOC-readable intent score, not another deny button

```
{FirstName} —

{PersonalizationFact}

SOC queues already have fraud/TM and policy denies. What they lack on a banking assistant is a pre-tool reading of genuine customer intent, with coordinates and reason codes, that does not pretend to be an allow/block.

ELAH scores; the bank decides. Analyst card at /admin/elah-events shows Uncalibrated (rules). Customer UI shows none of it.

Simulator MVP. POST /v1/score, rules_v0. Gold v1.0: 571 / holdout 100 / seed 20260826. Blinded holdout: 0.79 intent accuracy, FP 0, FN 1, injection recall 0.59, ECE 0.153 uncalibrated. Not TM. Not a model.

$400K pre-seed / 12 months. Live demo on Jane + the score card.

Best,
[Founder]
```

---

## 5. Variant — Fintech / banking investor

**Subject:** {Firm} — scoring intent on the assistant path, without replacing policy

```
{FirstName} —

{PersonalizationFact}

Retail banks are exposing transfer, bill-pay, freeze, and statement tools through chat. The policy engine still confirm/deny. Nobody scores whether the utterance looks like genuine banking intent before the tool runs.

ELAH is that score. We do not execute, we do not override policy, we do not show the number to the customer. High financial-risk on a genuine wire is correct, not a fraud hit.

Live simulator (not a contracted bank). POST /v1/score, rules_v0. Gold v1.0 571 rows, holdout 100, seed 20260826. Blinded holdout 0.79 / FP 0 / FN 1 / injection recall 0.59 / ECE 0.153 uncalibrated. No ARR to quote.

$400K pre-seed / 12 months. I can run the Jane confirm-transfer vs injection refuse demo.

Best,
[Founder]
```

---

## 6. Variant — Israeli fund

**Subject:** {Firm} — ELAH pre-tool banking-intent score (simulator MVP)

```
{FirstName} —

{PersonalizationFact}

ELAH is a pre-tool intention score for authenticated banking assistants. Bank policy remains allow / deny / confirm. We never allow, block, or execute, and we do not sell “we catch fraud.”

The demo is a live ILS-denominated simulator (Jane: basic.customer@elah.demo), not a named Israeli bank and not production core-banking. POST /v1/score, provenance rules_v0.

Gold v1.0: 571 rows, holdout 100, seed 20260826. Blinded holdout: intent accuracy 0.79, legitimate-as-injection FP 0, FN 1, injection recall 0.59, ECE 0.153 uncalibrated. rules_v0 is not a trained model.

$400K pre-seed / 12 months. Happy to walk the transfer + injection path and the uncalibrated analyst card.

Best,
[Founder]
```

---

## 7. Optional one-line follow-up (if no reply; still do not invent a meeting)

```
{FirstName} — circling the 12-minute Jane transfer + injection demo and the blinded holdout numbers (0.79 / FP 0 / FN 1). No new traction since the last note. Happy to send the one-pager or stop.
```

Do not send a third chase from this pack. Do not log “intro completed.”

---

## 8. Forbidden copy (delete if a draft grows it)

- “We block fraud” / “we stop attacks” / “ELAH denied the transfer”
- “Accuracy 100%” / “1.00 on holdout” / “calibrated model”
- Named banks, LOIs, ARR, pipeline dollar figures
- ATM, `device_change`, beneficiary-write as product
- “Jane sees a risk score”
- Fake VC quotes or “partners include”

---

*End of document.*
