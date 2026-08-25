# ELAH vs Bank Policy Boundary

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-BOUNDARY-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-boundary-between-elah-and-the-bank-s-` |

---

## 1. Purpose

Stop ELAH becoming a shadow policy engine. The bank (simulator: `lib/agent/policy.ts`) **allows, denies, and confirms**. ELAH **scores and explains**.

---

## 2. Sequence

```
utterance → plan tool → BANK POLICY (allow | deny | needs_confirmation)
        → (confirm if needed) → POST /v1/score → BANK executes if policy already allows
```

ELAH is **after** policy context is known and **before** `executeTool`. A low score does not cancel an allowed tool. A high score does not execute a denied tool.

---

## 3. RACI

| Decision | Bank policy | ELAH | Analyst | Founder |
|---|---|---|---|---|
| Allow / deny / confirm tool | **A/R** | I | C (after the fact) | I |
| Intention score + label | I | **A/R** | C | C |
| Abstain (unreliable score) | I | **A/R** | C | I |
| `policyHook` recommendation | C (optional consumer) | **R** | C | I |
| Fail-open on timeout | **A/R** (continue policy) | I | I | I |
| Thresholds for *their* SOC | **A** (tenant) | C (defaults only) | R (operate) | C |
| Customer-visible errors | **A/R** | I | I | I |

A = accountable, R = responsible, C = consulted, I = informed.

---

## 4. What each side must not do

| Party | Must not |
|---|---|
| ELAH | Execute tools; emit allow/deny/confirm; gate `executeTool` |
| Simulator | Skip policy because the score was high; pretend a 422 was a score |
| Analyst UI | Buttons labelled “ELAH Allow” / “ELAH Block” |
| `policyHook` | Values other than `none` / `watch` / `review` / `step_up_hint` |

---

## 5. Demo proof

Show a **confirmed transfer with a watch hook** and an **injection with policy refuse + low score**. Both stories: “ELAH scored; the bank decided.”

---

## 6. Sign-off

I agree allow/deny/confirm stay with bank policy; ELAH only scores, explains, and optionally recommends attention.

---

*End of document.*
