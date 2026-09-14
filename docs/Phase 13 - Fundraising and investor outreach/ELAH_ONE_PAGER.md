# ELAH One-Pager

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-1P-001 |
| Version | **0.2** |
| Status | **Proposed** |
| Date | 14 September 2026 |
| Classification | Internal — ELAH Security (fundraising pack) |
| Owner | Founder |
| Length | One page. Do not append a second page of metrics. |
| Ask source | Founder dashboard `FIRST_ROUND_PLAN` — **founder-approved working ask** (26 August 2026; not closed) |
| Wedge | Phase 16 — first-client motion is B2B SaaS CS/CRM ops (founder-approved 8 September 2026) |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** on the event envelope (`ElahScoreSnapshot`). Customer / support-user UI MUST NOT show `elahScore`. Banking simulator remains an **existing demo**, not the first sales motion. Banking closed-label freeze and `rules_v0` (uncalibrated, not a trained model) stay as banking evidence only.

---

ELAH scores **genuine support and CRM intent** on authenticated B2B SaaS assistants **before ticket, refund, and record-write tools execute**. First-client motion is **CS/CRM operations** (Head of Support, VP CX, CRM ops / RevOps). It returns `elahScore` (higher = more genuine), a closed CS/CRM intent label, and explanation signals. **Company policy** still allow / deny / confirm. ELAH never allows, blocks, or executes. The customer never sees the score. ELAH is not a helpdesk, not a policy engine, not “we block refunds.”

**Live (simulator MVP, not a customer).** ELAH CRM Simulation: `basic.customer@elah.demo` and analyst `security.admin@elah.demo` / `DemoPass123!`. Local http://localhost:3003. Hosted https://elahcrmsystem.vercel.app. GitHub `benda17/ELAH_SECURITY-CRM-System`. Path: utterance → plan → tenant/company policy → `POST /v1/score` → execute only if policy already allows or the user confirmed. Fail-open on timeout (`scoring_unavailable`), not a block. Analyst sees the score; customer does not. There is **no production CS/CRM holdout** — do not quote the synthetic rules 1.00 as a model metric. Do not quote live Zendesk.

**Existing banking demo (not the first sales motion).** Jane banking simulator remains a working scoring demo. **Banking-gold / `rules_v0` only:** gold v1.0 **571** rows, holdout **100**, seed **20260826**, synthetic. Blinded holdout (hint stripped): intent accuracy **0.79**, legitimate-as-injection FP **0**, FN **1**, injection recall **0.59**, ECE **0.153** uncalibrated. Do **not** quote 1.00 (hint-echo). Do **not** quote these numbers as CS/CRM or refund accuracy. `rules_v0` is not a trained model.

**Ask.** **$400K** pre-seed / 12 months, **founder-approved working ask** (`FIRST_ROUND_PLAN`, 26 August 2026). **Not closed.** Year-1 plan revenue **$0**. 12-month goal: a first **demo/dev** install with a B2B SaaS CS/CRM ops team — not a named customer, not production. Open the demo on a genuine refund + injection in CRM Simulation; Jane is optional encore.

---

*End of document.*
