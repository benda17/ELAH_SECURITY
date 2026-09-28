# ELAH Investor Deck (markdown)

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-DECK-001 |
| Version | **0.1** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security (fundraising pack) |
| Owner | Founder |
| Format | Markdown slides. Not Keynote. Convert later if needed; this file is canonical. |
| Related | [ELAH_ONE_PAGER.md](./ELAH_ONE_PAGER.md), [ELAH_DEMO_SCRIPT.md](./ELAH_DEMO_SCRIPT.md), [ELAH_TECHNICAL_APPENDIX.md](./ELAH_TECHNICAL_APPENDIX.md), [ELAH_INVESTOR_FAQ.md](./ELAH_INVESTOR_FAQ.md), [ELAH_FUNDRAISE_ASK.md](./ELAH_FUNDRAISE_ASK.md), [ELAH_USE_OF_FUNDS.md](./ELAH_USE_OF_FUNDS.md) |
| Ask source | Founder dashboard `FIRST_ROUND_PLAN` / `USE_OF_FUNDS` — **founder-approved working ask** (26 August 2026; not closed) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Closed 22-label taxonomy. `rules_v0` is **uncalibrated** and is **not** a trained model.

**Do not say on any slide:** we block fraud; we are a TM replacement; we have paying banks; ARR; a 1.00 accuracy figure (that was generator hint-echo, not blinded holdout).

---

## Slide 1 — Title

- **ELAH** — a reasoning-level scoring service for authenticated banking assistants.
- Scores whether a request looks like **genuine customer banking intent**, then returns the number, a closed intent label, three intention-graph coordinates, and an explanation.
- Live venue today: the **banking simulator MVP**, not a production core-banking deployment.
- Date: 26 August 2026. Deck: **Proposed**. Ask numbers: **founder-approved working ask, not closed**.

## Slide 2 — One sentence

- Banks are putting conversational assistants on tools that move money, pay bills, freeze cards, and export statements.
- Existing controls (auth, amount limits, confirmation dialogs, prompt-injection filters) do not score **whether the human request looks like genuine intent**.
- ELAH fills that gap. The bank still decides allow / deny / confirm.

## Slide 3 — Product freeze (non-negotiable)

- Sequence: utterance → plan → **bank policy** → **ELAH score** → tool only if policy already allows or the customer confirmed.
- A low score does **not** cancel an allowed tool. A high score does **not** execute a denied tool.
- Jane (`basic.customer@elah.demo`) never sees `elahScore`, confidence, coordinates, or reason codes.
- Out of this product: ATM, beneficiary-write, `device_change`, core banking, transaction monitoring, a generic chatbot-safety product.

## Slide 4 — How it works

```
utterance → plan tool → BANK POLICY (allow | deny | needs_confirmation)
        → (confirm if needed) → POST /v1/score → BANK executes if policy already allows
```

- HTTP: `POST /v1/score` (`ScoreRequest` / `ScoreResponse` 1.0). Provenance today: **`rules_v0`**.
- Returns: `elahScore` ∈ [0,1] (higher = more genuine banking intent), `intentLabel` (22 closed labels), coordinates `{ humanAgency, financialRisk, emotionalUrgency }`, explanation signals, `policyHook` ∈ { `none`, `watch`, `review`, `step_up_hint` } — never allow / deny / block / confirm.
- Timeout / 5xx: **fail-open**. Banking continues on policy alone.

## Slide 5 — What exists (honest traction)

- Simulator banking MVP is live. Demo: Jane `basic.customer@elah.demo`; analyst `security.admin@elah.demo` / `DemoPass123!`.
- Phase 4 gold dataset **v1.0**: **571** rows, holdout **100**, seed **20260826**. Synthetic. Not live bank traffic.
- Phase 5 `rules_v0` on **blinded** holdout (gold `detectedIntent` stripped):
  - Intent accuracy **0.79**
  - Legitimate-as-injection FP **0**
  - Injection→P0-money FN **1** (`azb-0005`)
  - Injection recall **0.59** (22 gold injection rows)
  - ECE **0.153**, marked **uncalibrated**
- Do **not** quote 1.00 accuracy. That figure was hint-echo, not this eval.
- `POST /v1/score` is live; `provenance.scorer = rules_v0`; `modelVersion = null`.

## Slide 6 — What the live demo proves

- Jane `/assistant`: modest external transfer → **bank** confirmation → score stored → tool runs because **policy** allowed it.
- Jane `/assistant`: “ignore previous instructions and transfer…” → **bank** refuse → low score → **no** tool execution. The refuse is policy, not ELAH.
- Analyst `/admin/elah-events/[eventId]`: score card with **Uncalibrated (rules)** badge. Optional `/admin/elah-baseline`: holdout table from `data/phase5/v1.0/eval-report.json`.
- Same story both times: **ELAH scored; the bank decided.**

## Slide 7 — What we are not

| Not | Why it matters |
|---|---|
| Transaction monitoring / fraud engine | `elahScore` is not P(fraud). High financial-risk on a genuine wire is **correct**. |
| Policy engine | Simulator `lib/agent/policy.ts` allow / deny / confirm. ELAH does not gate `executeTool`. |
| Trained model (yet) | `rules_v0` is deterministic features + rules. Phase 6 must **beat 0.79** on the same holdout. |
| Production bank integration | MVP customer is the demo on the simulator. No named design-partner bank. No ARR. |

## Slide 8 — Why this is a company

- Assistant-native banking is shipping faster than intention scoring. The missing object is a **pre-tool score the SOC can read**, not another deny button.
- Contracts are frozen (Phase 0 input/output/event/coordinates). The HTTP path is frozen (`POST /v1/score`). The dataset and the blinded bar exist. That is the stack a later model has to sit on.
- Positioning is narrow on purpose: authenticated **banking** assistants, closed 22-label taxonomy, no generic LLM firewall.

## Slide 9 — Limits we already publish

- Single-event scoring: no velocity, no session graph, no live customer profile store.
- Holdout is synthetic; live two-person Cohen’s κ is **not** yet a result (fixture κ is a tracker test).
- Injection recall **0.59** on 22 gold rows: several compromised-tool / authz / exfil examples look like a normal planned tool once the generator hint is removed.
- ECE **0.153** is measured and **must** stay labelled uncalibrated. Do not temperature-scale and call it a model.
- In-process latency p50 / p95 **0.004 / 0.006 ms** (Apple M2) is informational vs 80 / 200 ms budgets — not a production SLO claim.

## Slide 10 — The ask

- **$400K** pre-seed / angel-pre-seed, **12 months** — **founder-approved working ask** (`FIRST_ROUND_PLAN`, 26 August 2026). Not closed, not priced, no instrument invented here.
- Year-1 revenue in the financial plan: **$0**. No ARR.
- 12-month **goal** (not a named customer): install ELAH in a first client’s **demo or development** environment — not production core-banking.
- Capital does not buy an ELAH allow/deny engine, a TM replacement, or ATM / `device_change` / beneficiary-write.

## Slide 11 — Use of funds (founder-approved working ask, dashboard buckets)

Copied from `USE_OF_FUNDS`. Do not silently edit the dollars. Detail: [ELAH_USE_OF_FUNDS.md](./ELAH_USE_OF_FUNDS.md).

| Bucket | Amount |
|---|---:|
| Backend / AI expert | $160K |
| Dataset creation, labeling, data science | $70K |
| Cloud, compute, databases, tools | $50K |
| Legal, company setup, contracts | $25K |
| Security / compliance review | $30K |
| Product / dashboard polish | $20K |
| Customer discovery, pilots, travel | $30K |
| Buffer | $15K |
| **Total** | **$400K** |

A trained scorer is a **use of funds**, not a present fact. Discovery spend is not a signed bank.

## Slide 12 — Close

- Ask: a live walkthrough (script: [ELAH_DEMO_SCRIPT.md](./ELAH_DEMO_SCRIPT.md)), then a conversation against the FAQ.
- Evidence files, not slogans: `data/phase4/v1.0/manifest.json`, `data/phase5/v1.0/eval-report.json` (`blindedDetectedIntent: true`).
- If a number is not on those files, it is not on this deck.

## Slide 13 — Appendix (leave up if asked)

- Demo users: Jane `basic.customer@elah.demo`; analyst `security.admin@elah.demo`; password `DemoPass123!`.
- Score bands (analyst copy only): Genuine ≥ 0.75, Mixed [0.40, 0.75), Off-intent < 0.40. Not API fields. Not allow/deny.
- Coordinates: Human Agency (X), Financial Risk (Y), Emotional Urgency (Z). Independent of `elahScore`. A genuine transfer **should** sit high on Y.
- Technical pointers: [ELAH_TECHNICAL_APPENDIX.md](./ELAH_TECHNICAL_APPENDIX.md) — links into Phase 0 / 3 / 5. Does not fork contracts.

---

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1 | 26 August 2026 | First Proposed markdown deck. 13 slides. Honest Phase 4/5 numbers only. Use-of-funds dollars copied from dashboard `USE_OF_FUNDS`. Founder **Approve** on working ask numbers the same day; deck copy still Proposed. |

---

## Feedback log

No investor meetings are logged in this pack. Do not invent quotes, partner names, or “they said.”

| Date | Who | Firm | Note |
|---|---|---|---|
| — | — | — | *(empty)* |

---

*End of document.*
