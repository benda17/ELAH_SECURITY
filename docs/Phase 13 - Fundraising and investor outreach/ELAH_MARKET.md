# ELAH Market Wedge

| Field | Value |
|---|---|
| Document ID | ELAH-FUND-MKT-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 26 August 2026 |
| Classification | Internal — ELAH Security (investor memo; not a TAM model) |
| Owner | Founder |
| Related task | `task-13-add-market-research` |
| Depends on | `ELAH-PRD-MVP-SCOPE-001`, `ELAH-SPEC-BOUNDARY-001`, Phase 11 interview guide (unexecuted) |
| Data-room pointer | [data-room/market/README.md](./data-room/market/README.md) |

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. No ATM, beneficiary-write, or `device_change` product. Do not `prisma db push`. This memo does **not** invent customers, interviews, ARR, or a TAM.

---

## 1. Purpose

Name the **wedge** in words a buyer and an investor can check: authenticated banking assistants that can **call tools**, plus a control that answers “does this look like genuine customer banking intent?” **before** the tool runs.

This is a qualitative memo. Where a number appears, it has a public source. If we cannot cite a number, the line is **unknown — do not quote a TAM**.

No customer interviews have been completed for this memo. Phase 11 (`docs/ELAH_BANKING_DOMAIN_INTERVIEW_GUIDE.md`) is the interview protocol; it is **not** evidence of calls held.

---

## 2. The problem (qualitative)

Banks are putting conversational interfaces in front of **account actions**: balance, transfers, payments, cards, statements. Once the assistant can invoke tools, a wrong or hostile interpretation is no longer “bad text” — it is a **planned banking action**.

Existing controls still matter and are **not** ELAH:

| Control | What it answers | What it does not answer |
|---|---|---|
| Authentication | Is this an enrolled customer session? | Is the *request* genuine banking intent vs injection, confusion, or off-intent? |
| Bank policy (allow / deny / confirm) | May this tool run, for this role, at this amount? | Should the SOC treat the *reasoning* as aligned with a real customer goal? |
| Amount limits / step-up | Is the money move over a threshold? | A small genuine-looking wire that is actually a prompt injection |
| Transaction monitoring (AML) | Do *posted* (or queued) transactions fit the customer’s financial-crime profile? | Pre-tool assistant intent on a single conversational turn |

ELAH’s claim is narrow: **score genuine banking intent before tools**. The bank still decides allow / deny / confirm. ELAH never executes.

---

## 3. Why the category is real (cited, not sized)

These sources establish **risk language and product existence**. They are not ELAH customers and they are not a market forecast.

| Claim we may repeat | Source | What we do **not** claim |
|---|---|---|
| Prompt injection is a first-class LLM application risk (LLM01:2025), including effects on connected functions | OWASP Top 10 for LLM Applications 2025, LLM01 Prompt Injection ([project PDF](https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf); [initiative page](https://genai.owasp.org/initiatives/top-10-for-llm-and-genai/)) | That ELAH is an OWASP-certified control; that prompt-injection **scanner** TAM equals ELAH TAM |
| Tool-using LLM apps can take damaging actions when functionality, permissions, or autonomy are excessive (LLM06:2025 Excessive Agency) | Same OWASP 2025 list, LLM06 | That ELAH replaces least-privilege, human-in-the-loop, or bank policy |
| Organizations are expected to govern, map, measure, and manage generative-AI risks | NIST, *AI Risk Management Framework: Generative Artificial Intelligence Profile* (NIST AI 600-1, July 2024) ([NIST publication page](https://www.nist.gov/publications/artificial-intelligence-risk-management-framework-generative-artificial-intelligence); [PDF](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)) | That NIST mandates ELAH; that AI-governance spend is ELAH’s TAM |
| AML/CFT standards require ongoing scrutiny of **transactions** against customer knowledge and risk profile (CDD), not assistant-intent scoring | FATF Recommendation 10 (customer due diligence), [FATF Recommendations](https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Fatf-recommendations.html) | That ELAH is an AML transaction-monitoring product |
| Large banks already ship **authenticated virtual assistants** in mobile banking (example: Bank of America’s Erica; the bank’s own FAQ states it uses NLP/ML, **not** generative AI / LLMs) | Bank of America, Erica product page: [https://info.bankofamerica.com/en/digital-banking/erica](https://info.bankofamerica.com/en/digital-banking/erica) | That BofA is an ELAH customer; that Erica uses ELAH; interaction-count headlines from press (**unknown — do not quote a TAM** or a traffic number unless citing BofA’s own filing) |

The wedge is the **gap between** (a) assistants that can act and (b) TM / auth / policy that do not score **conversational intent before the tool**. Scripted NLP assistants (Erica’s published design) and tool-calling genAI assistants are not the same stack; the risk OWASP names is sharpest when the model can **invoke tools**.

---

## 4. Buyers (roles, not logos)

No bank has contracted ELAH. Buyer list is a **hypothesis** for Phase 11 / 12, aligned with MVP scope (`ELAH-PRD-MVP-SCOPE-001`) and the interview guide.

| Buyer seat | Why they might care | What they must not be told |
|---|---|---|
| **Digital banking / assistant owners** | They ship the chat + tool planner; they need a score + explanation without giving ELAH `executeTool` | That ELAH will raise conversion by blocking “bad” customers |
| **SOC / cybersecurity** | Injection, compromised-tool, and excessive-agency narratives (OWASP LLM01 / LLM06) land in their vocabulary | That ELAH is an EDR or a prompt firewall that “stops all jailbreaks” |
| **AI governance / model risk** | NIST AI RMF-style measure/manage: versioned scores, provenance (`rules_v0` today), abstain, analyst UI | That `rules_v0` is a calibrated model or a regulatory certification |
| Fraud / AML (adjacent, not primary) | May sit in the same steering group | That ELAH replaces transaction monitoring or SAR workflows |
| Risk / compliance | Policy stays with the bank; ELAH is a hook, not enforcement | That buying ELAH is an AML program |

Israeli digital banking, SOC, and AI-governance leads are the Phase 11 prioritization in Kanban — **not** a closed design-partner list.

---

## 5. Adjacent categories vs ELAH

ELAH is **not** a clone of these products. Overlap is “AI + bank + risk” branding, not the same job-to-be-done.

| Adjacent category | Typical job | ELAH | How to talk without lying |
|---|---|---|---|
| **Transaction monitoring / AML** | After (or as) money moves: typologies, customer profile, STR/SAR | Pre-tool **intent** on an assistant event | Cite FATF CDD/monitoring of *transactions*. ELAH does not file SARs and does not score ledger graphs |
| **Fraud decisioning / card auth** | Is this payment/device anomalous? | Is this **utterance + planned tool** genuine banking intent? | A genuine high-value transfer can score as high intent + high financial risk. That is not a fraud “block” |
| **Bot / chatbot safety** (generic toxicity, jailbreak filters for consumer bots) | Keep the model from saying the wrong thing | Banking-only taxonomy (22 labels), coordinates, policy **hook** | Generic bot-safety does not know `external_transfer` vs `prompt_injection_or_policy_bypass` in a bank tool planner |
| **Prompt-injection scanners / LLM firewalls** | Detect injection strings or classify prompts | Score **genuine intent** including legitimate money moves; injection is one label among 22 | OWASP LLM01 is the shared problem language. A scanner that only flags injection still leaves “mistaken user” vs “genuine wire” vs “policy bypass” unsolved. ELAH does not claim to be a complete LLM01 mitigation |
| **Agent observability / tracing** | What tools ran, traces, evals | Score **before** execute; bank already logs tools | Phase 2 capture is complementary; ELAH is not Datadog |
| **Policy engines / IAM** | Allow / deny / confirm | **Never** allow / deny / confirm | The bank keeps policy (`ELAH-SPEC-BOUNDARY-001`) |

If a fund’s thesis is “fraud TM” or “chatbot safety for any vertical,” ELAH is a **misfit** unless they also care about agent tool-use in **banking**. Do not rewrite the product to fit the thesis.

---

## 6. What we will not quote

| Topic | Line to use |
|---|---|
| Total addressable market ($B) | **Unknown — do not quote a TAM** |
| Spend on “AI security” or “AML software” from analyst PDFs not attached here | **Unknown — do not quote a TAM** |
| Number of banks that will buy in 12 months | **Unknown** — Phase 12 is not done |
| Win rate, pipeline $ | **Zero outbound** as of this memo; CRM must not show fake contacted rows |
| Competitor revenue or “they told us…” | **No interviews.** Do not invent competitor quotes |
| BofA / any bank as design partner | **Not a customer.** Erica is a **public example of a banking assistant**, not a reference |

Vendor blogs that assert “80% of FS leaders” or similar survey stats are **not** used here (sample, sponsor, and instrument not verified for this memo).

---

## 7. Traction that *is* in-repo (not market size)

Cite product evidence, not market size:

- Simulator MVP; demo path in Phase 5 exec summary.
- Phase 4 gold v1.0 (571 rows, holdout 100); taxonomy **Approved**.
- Phase 5 `rules_v0` blinded holdout intent accuracy **0.79**, uncalibrated (ECE 0.153). Not a production risk engine.

See [ELAH_ROADMAP_FOR_INVESTORS.md](./ELAH_ROADMAP_FOR_INVESTORS.md).

---

## 8. Sources

1. OWASP, *Top 10 for Large Language Model Applications 2025*, LLM01 Prompt Injection and LLM06 Excessive Agency — https://owasp.org/www-project-top-10-for-large-language-model-applications/assets/PDF/OWASP-Top-10-for-LLMs-v2025.pdf and https://genai.owasp.org/initiatives/top-10-for-llm-and-genai/
2. NIST, *Artificial Intelligence Risk Management Framework: Generative Artificial Intelligence Profile* (NIST AI 600-1, July 2024) — https://doi.org/10.6028/NIST.AI.600-1
3. FATF, *The FATF Recommendations* (Recommendation 10, customer due diligence / ongoing scrutiny of transactions) — https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Fatf-recommendations.html
4. Bank of America, Erica virtual financial assistant (product FAQ: NLP/ML, not generative AI) — https://info.bankofamerica.com/en/digital-banking/erica
5. ELAH product fence — `docs/Phase 0 - Product Definition/ELAH_MVP_SCOPE.md`
6. Interview protocol (unexecuted) — `docs/ELAH_BANKING_DOMAIN_INTERVIEW_GUIDE.md`

---

## 9. Sign-off

| Decision | Initials | Date |
|---|---|---|
| Approve | | |
| Approve with comments | | |
| Reject | | |

---

*End of document.*
