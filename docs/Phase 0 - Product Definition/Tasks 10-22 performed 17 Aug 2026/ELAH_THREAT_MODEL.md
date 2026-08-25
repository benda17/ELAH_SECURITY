# ELAH Threat Model (MVP)

| Field | Value |
|---|---|
| Document ID | ELAH-SPEC-THREAT-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 17 August 2026 |
| Related task | `task-0-define-the-threat-model` |

---

## 1. Purpose

What we are defending in the **demo**. STRIDE-style, mapped to mitigations already frozen in input/output/privacy specs.

---

## 2. Assets

| Asset | Why it matters |
|---|---|
| Customer session + ledger in simulator | Fake money, real demo credibility |
| Service token for `/v1/score` | Anyone with it can spam scores |
| Training rows | Future model poison / PII leak |
| Explanation text | Prompt-injection exfil channel |
| Founder login | Roadmap + dataset access |

---

## 3. Threats and mitigations

| ID | Threat | STRIDE | Mitigation |
|---|---|---|---|
| TM-1 | Prompt injection via chat | Tampering / elevation | Policy deny; score as `prompt_injection_or_policy_bypass`; **do not execute** |
| TM-2 | Forge `ElahEvent` from browser | Spoofing | `/v1/score` is **server-to-server** only |
| TM-3 | Replay / duplicate `requestId` | Tampering | Idempotency: same `requestId` → same response (input contract) |
| TM-4 | Oversized body / DoS | DoS | 32 KiB cap; 10 RPS target |
| TM-5 | Token leak in client bundle | Info disclosure | Token never in frontend |
| TM-6 | Explanation dumps secrets | Info disclosure | Signal ids only; no utterance; no CoT |
| TM-7 | Score used as allow/deny | Elevation | Boundary spec; `policyHook` never allow/deny |
| TM-8 | Timeout → silent skip of policy | Elevation | Fail-open **continues existing policy**, does not skip it |
| TM-9 | Poisoned training labels | Tampering | Synthetic gold; founder-only write |
| TM-10 | Analyst UI XSS from summary | Tampering | Escape `explanation.summary`; cap 240 chars |

---

## 4. Out of scope (MVP)

Nation-state against Vercel/Neon; physical ATM; real-bank HSM. Demo credentials are public (`*@elah.demo`) — **do not** treat them as a secret store.

---

## 5. Sign-off

I agree these ten threats and mitigations are the MVP threat model.

---

*End of document.*
