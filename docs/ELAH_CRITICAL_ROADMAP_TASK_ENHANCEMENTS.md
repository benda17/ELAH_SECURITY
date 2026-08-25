# ELAH Critical Roadmap Task Enhancement Pack

| Field | Value |
|---|---|
| Date | 17 August 2026 |
| Source | Neon result set pasted by founder |
| Filter | `status IN ('backlog', 'in_progress') AND priority = 'critical'` |
| Tables | `RoadmapTask` only |
| Safety | No DELETE/TRUNCATE/DROP/ALTER; UPDATE statements only for task text fields |

## 1. Summary

This document enhances the descriptions, success criteria, deliverables, and notes for the remaining critical roadmap tasks that are still in `backlog` or `in_progress`.

It does not change status, priority, phase, owner, dates, dependencies, or critical-path flags.

## 2. Tasks enhanced

### task-2-capture-tool-call-requests — Capture tool-call requests.

**Phase:** Phase 2 — Agent observability and event collection  
**Workstream:** Engineering  
**Status:** `backlog`  
**Priority:** `critical`  
**Critical path:** `True`

#### Enhanced description

Instrument the live banking assistant so every planned tool call is captured as a structured pre-execution request before any side effect occurs. This is the first engineering step that makes ELAH scoring possible: ELAH cannot score what the simulator does not capture. The work must cover all P0/P1 assistant tools, preserve agent-vs-UI provenance, sanitize tool arguments, attach conversation/message/session context, and record bank-policy context before execution. This task does not build the scoring service and does not change bank policy; it creates the observable pre-tool moment that later feeds the normalized ElahEvent envelope and POST /v1/score.

#### Success criteria

- Every live assistant tool request is captured before executeTool or equivalent side-effect code runs.
- P0 tools are covered: create_internal_transfer, create_external_transfer, pay_bill, freeze_card, unfreeze_card, get_monthly_statement.
- P1 tools are covered: balance, transaction, spending, cards, recipients, and support tools.
- Captured record includes toolName, sanitized args, actionType candidate, conversationId, messageId, sessionId, user hash source, policy decision/reasons, confirmationRequired, and createdByAgent/source.
- Prompt-injection or policy-denied requests produce a captured event instead of disappearing silently.
- No raw password, token, raw account id, full card id, or unsanitized recipient name is persisted.
- A fixture/test proves that the capture occurs before tool execution.
- Founder can demo at least one transfer path where a tool-call request is visible before execution.

#### Deliverables

- Instrumentation code around the assistant tool planner/executor boundary.
- Captured request event for each allow-listed assistant tool.
- Sanitization helper or reuse of the event-schema sanitizer.
- Test fixtures for at least external transfer, statement download, card freeze, and injection refusal.
- Short implementation note showing where the pre-tool hook lives and how it feeds the normalized envelope.

#### Notes

Critical path for pre-tool scoring. Must align with ELAH-SPEC-EVENT-001, ELAH-SPEC-INPUT-001, and ELAH-SPEC-OUTPUT-001.

---

### task-2-create-a-normalized-event-envelope — Create a normalized event envelope.

**Phase:** Phase 2 — Agent observability and event collection  
**Workstream:** Engineering  
**Status:** `backlog`  
**Priority:** `critical`  
**Critical path:** `True`

#### Enhanced description

Implement the normalized ElahEvent envelope that maps the simulator's existing operational records into one canonical event shape for ELAH ingest. Today the app writes AuditLog, AgentEventLog, and ElahTrainingEvent-style records with overlapping but inconsistent names. This task creates the translation layer that produces ElahEvent schemaVersion 1.0 for scoring, training export, and analyst dashboards. It is contract work, not model work: the output must be strict, versioned, sanitized, and compatible with the event-schema samples.

#### Success criteria

- A reusable mapper serializes live simulator activity into ElahEvent schemaVersion 1.0.
- Agent and UI versions of the same action use the same canonical actionType and differ by source/createdByAgent only.
- Page-view audit rows are excluded from ELAH ingest.
- P0/P1 assistant actions and P2 UI actions produce schema-valid envelopes.
- Mapper rejects or flags events with unknown actionType, missing source, missing required actor/session fields, or unsanitized args.
- Event samples from ELAH-SPEC-EVENT-001 sections 8.1–8.5 pass validation; invalid samples fail.
- Output can be consumed by POST /v1/score without caller-side reshaping.

#### Deliverables

- ElahEvent mapper module.
- Validation helper for ElahEvent 1.0.
- Mapping table from live aliases to canonical actionType.
- Sanitization pass for action.args and identity fields.
- Tests covering valid agent transfer, statement download, prompt-injection refusal, UI transfer, login, and invalid page view.
- Developer note linking code behavior to the Confluence Event Schema page.

#### Notes

This is the bridge between simulator observability and service integration. It should not introduce scores; scores belong to the output contract.

---

### task-3-define-the-scoring-api — Define the scoring API.

**Phase:** Phase 3 — ELAH service foundation  
**Workstream:** Engineering  
**Status:** `backlog`  
**Priority:** `critical`  
**Critical path:** `True`

#### Enhanced description

Freeze the full scoring API contract used between the banking simulator and the ELAH scoring service. This includes the pre-tool HTTP request wrapper, the canonical ElahEvent body, the ScoreResponse body, validation errors, idempotency, fail-open behavior, and OpenAPI documentation. This task is the integration agreement that lets Phase 3 build the service, Phase 2 wire simulator events, and Phase 9 bind dashboards without inventing separate shapes.

#### Success criteria

- Human spec exists for the ElahEvent schema.
- Human spec exists for POST /v1/score input contract.
- Human spec exists for ScoreResponse / ElahScore output contract.
- OpenAPI 3.x page/file defines the score endpoint, request wrapper, response body, and errors.
- Contracts explicitly state that ELAH does not allow, block, confirm, or execute.
- Contracts include accept/reject examples.
- Contracts include fail-open caller behavior for timeout/5xx and non-fail-open behavior for bad payloads.
- Spec chain is visible in Confluence and can be used by an implementer without asking the founder.

#### Deliverables

- ELAH Event Schema page/document.
- ELAH Input Contract page/document.
- ELAH Output Contract page/document.
- OpenAPI — ELAH v1 Score Endpoint page/file.
- Links from the Technical Specifications index.
- Optional SQL update linking this task to the Confluence spec pages.

#### Notes

The core documentation for this task is already created in Confluence. Recommended next action: review, then update status to in_review/done when signed.

---

### task-3-create-a-mock-scoring-implementation — Create a mock scoring implementation.

**Phase:** Phase 3 — ELAH service foundation  
**Workstream:** Engineering  
**Status:** `backlog`  
**Priority:** `critical`  
**Critical path:** `True`

#### Enhanced description

Build a deterministic mock implementation of the ELAH scoring service behind POST /v1/score. The mock must validate ScoreRequest, enforce the input/output contracts, and return stable plausible ScoreResponse objects for fixture events before any trained model exists. This unblocks simulator wiring, dashboard binding, investor demos, and baseline comparison. The mock is not the final model; it is a contract-faithful service that behaves consistently enough for integration and demos.

#### Success criteria

- POST /v1/score accepts valid ScoreRequest contractVersion 1.0 and rejects invalid wrappers/events according to the input contract.
- Service returns ScoreResponse contractVersion 1.0 with elahScore, confidence, uncertainty, intentLabel, coordinates, explanation, policyHook, and provenance.
- Outputs are deterministic for identical eventId/mode/body and respect idempotency rules.
- At least these fixtures produce stable outputs: external transfer, internal transfer, pay bill, statement download, card freeze, support case, balance read, prompt injection, ambiguous request.
- Confidence and uncertainty are complementary.
- policyHook never emits allow/deny/block/confirm.
- Invalid request examples from the input contract fail with the documented codes.
- Mock can run locally with the banking simulator environment.

#### Deliverables

- Minimal scoring service route for POST /v1/score.
- Deterministic scoring rules/fixture map.
- Idempotency cache or deterministic replay behavior.
- Contract validation using schema helpers.
- Test fixture suite.
- README section: local run, env vars, sample curl, known limitations.

#### Notes

This should optimize for contract stability and demo reliability, not model sophistication.

---

### task-3-connect-the-existing-banking-simulator-to-the-mo — Connect the existing banking simulator to the mock ELAH service.

**Phase:** Phase 3 — ELAH service foundation  
**Workstream:** Engineering  
**Status:** `backlog`  
**Priority:** `critical`  
**Critical path:** `True`

#### Enhanced description

Wire the live banking simulator to call the mock ELAH service at the correct pre-tool point. The call must happen after bank policy has allow/deny/confirm context and before assistant tool execution for MVP P0/P1 actions. The simulator must persist the ScoreResponse against the originating eventId, handle timeouts with the documented fail-open behavior, and make the result visible in founder/analyst views. This is the first end-to-end proof that a live assistant action can produce a canonical event and receive an ELAH score.

#### Success criteria

- Simulator builds a valid ScoreRequest with ElahEvent 1.0 for P0/P1 assistant tool paths.
- Simulator calls POST /v1/score after policy/confirmation state is known and before executeTool for P0 actions.
- Response is stored against requestId and eventId.
- Timeout or 500/503 records scoring_unavailable and continues according to bank policy.
- 4xx contract errors are logged as producer defects and do not pretend a score exists.
- External transfer demo shows: user utterance → planned tool → policy confirmation → ELAH score → tool execution.
- Prompt-injection demo shows refused/blocked event scored and no tool execution.
- Analyst/founder view can display at least eventId, elahScore, intentLabel, coordinates, explanation, and policyHook.

#### Deliverables

- ELAH API client in the simulator.
- Config/env for ELAH service URL, service token, and client timeout.
- Pre-tool integration point for assistant P0/P1 tools.
- Persistence of ScoreResponse or scoring_unavailable.
- Logs/traces for requestId/eventId correlation.
- Demo script proving the full transfer and injection paths.

#### Notes

Depends on mock scoring implementation. Must follow 250 ms fail-open handshake from ELAH-SPEC-INPUT-001.

---

### task-4-define-the-label-taxonomy — Define the label taxonomy.

**Phase:** Phase 4 — Dataset and labeling system  
**Workstream:** Data  
**Status:** `backlog`  
**Priority:** `critical`  
**Critical path:** `True`

#### Enhanced description

Define and sign off the closed label taxonomy used to annotate ELAH banking events. This document tells annotators, rules, models, and dashboards exactly what each intent label means, how to choose between overlapping labels, and how to treat prompt injection, ambiguity, non-banking requests, and normal banking actions. The taxonomy is critical because the model cannot learn, the baseline cannot evaluate, and dashboards cannot filter if labels drift.

#### Success criteria

- Versioned taxonomy document exists.
- The 22 canonical ElahBankingIntent labels are listed with definitions.
- Tie-break rules exist for prompt injection, ambiguity, fraud vs dispute, external transfer vs bill payment, and scheduled payment.
- Annotation guidance exists for confidence, coordinates, and explanation signals.
- Sample annotation record exists.
- QA rules specify how labeled rows are accepted/rejected.
- Document is published in Confluence under Simulator, Data & Training.

#### Deliverables

- ELAH Label Taxonomy — Banking Intent Labels Markdown file.
- Confluence page under 03 — Simulator, Data & Training.
- Optional SQL update linking the task to the Confluence page and MD artifact.

#### Notes

Completed as a documentation deliverable in this response; review/sign-off still required before marking done.

---

### task-4-create-synthetic-legitimate-banking-scenarios — Create synthetic legitimate banking scenarios.

**Phase:** Phase 4 — Dataset and labeling system  
**Workstream:** Data  
**Status:** `backlog`  
**Priority:** `critical`  
**Critical path:** `True`

#### Enhanced description

Create a labeled pack of synthetic legitimate banking scenarios that represent normal, policy-compliant customer behavior in the simulator. These scenarios are the false-positive control set for ELAH: the model and baseline must learn not to overreact to routine transfers, reads, support cases, statement downloads, and card actions. The pack should be diverse across customer tier, channel, time, amount bucket, tool type, and intent label while staying fully synthetic and privacy-safe.

#### Success criteria

- Scenario pack contains at least 200 legitimate banking events before model training begins.
- Coverage includes P0 actions: internal transfer, external transfer, bill payment, card freeze/unfreeze, statement download.
- Coverage includes P1 actions: balance read, recent transactions, transaction lookup, spending summary, cards read, recipients read, support case.
- Each scenario has ElahEvent-compatible fields and a label-taxonomy-compatible intentLabel.
- Dataset includes low/medium/high financialRisk examples that are still genuine.
- Dataset includes UI vs agent twins for at least external transfer and statement download.
- No real PII, account numbers, card numbers, or real customer data.
- Train/validation/holdout split is documented.

#### Deliverables

- Synthetic legitimate scenario JSON/JSONL file.
- Optional spreadsheet or CSV preview for manual inspection.
- Data dictionary and generation notes.
- Label distribution summary.
- At least 10 examples per common P0/P1 class.
- Link to the label taxonomy version used.

#### Notes

Do this after label taxonomy sign-off. This is a data deliverable, not only a document.

---

### task-5-build-a-deterministic-rules-based-baseline — Build a deterministic rules-based baseline.

**Phase:** Phase 5 — Baseline scoring system  
**Workstream:** Model  
**Status:** `backlog`  
**Priority:** `critical`  
**Critical path:** `True`

#### Enhanced description

Implement the first deterministic ELAH baseline scorer using transparent rules rather than a learned model. The baseline must produce contract-valid ScoreResponse objects from ElahEvent inputs, using explicit signals such as actionType, toolName, policy decision, confirmation state, amount bucket, account context, source, prompt-injection signals, and ambiguity. This baseline is the MVP safety net: it gives explainable scores while the trained model is still under development and creates a measurable bar the model must beat.

#### Success criteria

- Baseline accepts normalized ElahEvent records and emits ScoreResponse v1.0.
- Rules cover all P0/P1 assistant action types and prompt-injection/no-tool events.
- Rules output elahScore, confidence, uncertainty, intentLabel, coordinates, explanation arrays, policyHook, and provenance.
- Prompt-injection/policy-bypass examples score low with review recommendation.
- Legitimate P0 actions can score high while still carrying high financialRisk/watch recommendation.
- Baseline is evaluated on a golden set with precision, recall, false positives, and false negatives.
- First trained model has a documented baseline to beat.
- Rules are deterministic and testable.

#### Deliverables

- Baseline scoring module.
- Signal extraction helper.
- Rule table or config file.
- Unit tests for every P0/P1 action class.
- Evaluation report on golden set.
- Documentation of known failure modes and thresholds.
- Integration with POST /v1/score mock or replacement path.

#### Notes

Should build on label taxonomy and scenario pack. This is the first explainable scorer, not the final trained model.

---

### task-11-conduct-banking-domain-interviews — Conduct banking-domain interviews.

**Phase:** Phase 11 — User discovery and customer validation  
**Workstream:** Business  
**Status:** `backlog`  
**Priority:** `critical`  
**Critical path:** `True`

#### Enhanced description

Conduct structured banking-domain interviews with people who understand assistant-driven banking workflows, fraud/security operations, payments, digital banking, AI governance, or customer support automation. The goal is to validate ELAH's product boundary: scoring genuine customer intent after bank policy and before assistant tool execution, without replacing fraud or policy engines. Interviews should test workflow realism, buyer identity, integration feasibility, false-positive sensitivity, and whether the live simulator demo tells a credible story.

#### Success criteria

- Interview guide exists and is published.
- At least 5 interviews are completed.
- Interviewees include at least 2 profiles such as product, fraud/SOC, payments ops, AI governance, or digital banking.
- Notes are captured using a consistent template.
- Each interview records problem resonance, buyer clarity, integration credibility, false-positive concern, and demo credibility.
- Founder summary identifies validated assumptions, invalidated assumptions, red flags, and required product/demo changes.
- At least 3 follow-up contacts or pilot leads are requested.

#### Deliverables

- ELAH Banking Domain Interview Guide Markdown file.
- Confluence page under 05 — Demos, GTM & Investor Materials.
- Interview notes template.
- Founder-facing synthesis after interviews.
- Updated demo/product assumptions based on repeated feedback.

#### Notes

Completed as a documentation prep deliverable in this response; actual interviews remain to be conducted.

---

## 3. SQL updates

Run these only if you want to update the roadmap database text fields. They update `description`, `successCriteria`, `deliverables`, `notes`, and `updatedAt` only.

```sql
UPDATE "RoadmapTask"
SET
  description = $elah$Instrument the live banking assistant so every planned tool call is captured as a structured pre-execution request before any side effect occurs. This is the first engineering step that makes ELAH scoring possible: ELAH cannot score what the simulator does not capture. The work must cover all P0/P1 assistant tools, preserve agent-vs-UI provenance, sanitize tool arguments, attach conversation/message/session context, and record bank-policy context before execution. This task does not build the scoring service and does not change bank policy; it creates the observable pre-tool moment that later feeds the normalized ElahEvent envelope and POST /v1/score.$elah$,
  "successCriteria" = $elah$- Every live assistant tool request is captured before executeTool or equivalent side-effect code runs.
- P0 tools are covered: create_internal_transfer, create_external_transfer, pay_bill, freeze_card, unfreeze_card, get_monthly_statement.
- P1 tools are covered: balance, transaction, spending, cards, recipients, and support tools.
- Captured record includes toolName, sanitized args, actionType candidate, conversationId, messageId, sessionId, user hash source, policy decision/reasons, confirmationRequired, and createdByAgent/source.
- Prompt-injection or policy-denied requests produce a captured event instead of disappearing silently.
- No raw password, token, raw account id, full card id, or unsanitized recipient name is persisted.
- A fixture/test proves that the capture occurs before tool execution.
- Founder can demo at least one transfer path where a tool-call request is visible before execution.$elah$,
  deliverables = $elah$- Instrumentation code around the assistant tool planner/executor boundary.
- Captured request event for each allow-listed assistant tool.
- Sanitization helper or reuse of the event-schema sanitizer.
- Test fixtures for at least external transfer, statement download, card freeze, and injection refusal.
- Short implementation note showing where the pre-tool hook lives and how it feeds the normalized envelope.$elah$,
  notes = $elah$Critical path for pre-tool scoring. Must align with ELAH-SPEC-EVENT-001, ELAH-SPEC-INPUT-001, and ELAH-SPEC-OUTPUT-001.$elah$,
  "updatedAt" = NOW()
WHERE id = $elah$task-2-capture-tool-call-requests$elah$;

UPDATE "RoadmapTask"
SET
  description = $elah$Implement the normalized ElahEvent envelope that maps the simulator's existing operational records into one canonical event shape for ELAH ingest. Today the app writes AuditLog, AgentEventLog, and ElahTrainingEvent-style records with overlapping but inconsistent names. This task creates the translation layer that produces ElahEvent schemaVersion 1.0 for scoring, training export, and analyst dashboards. It is contract work, not model work: the output must be strict, versioned, sanitized, and compatible with the event-schema samples.$elah$,
  "successCriteria" = $elah$- A reusable mapper serializes live simulator activity into ElahEvent schemaVersion 1.0.
- Agent and UI versions of the same action use the same canonical actionType and differ by source/createdByAgent only.
- Page-view audit rows are excluded from ELAH ingest.
- P0/P1 assistant actions and P2 UI actions produce schema-valid envelopes.
- Mapper rejects or flags events with unknown actionType, missing source, missing required actor/session fields, or unsanitized args.
- Event samples from ELAH-SPEC-EVENT-001 sections 8.1–8.5 pass validation; invalid samples fail.
- Output can be consumed by POST /v1/score without caller-side reshaping.$elah$,
  deliverables = $elah$- ElahEvent mapper module.
- Validation helper for ElahEvent 1.0.
- Mapping table from live aliases to canonical actionType.
- Sanitization pass for action.args and identity fields.
- Tests covering valid agent transfer, statement download, prompt-injection refusal, UI transfer, login, and invalid page view.
- Developer note linking code behavior to the Confluence Event Schema page.$elah$,
  notes = $elah$This is the bridge between simulator observability and service integration. It should not introduce scores; scores belong to the output contract.$elah$,
  "updatedAt" = NOW()
WHERE id = $elah$task-2-create-a-normalized-event-envelope$elah$;

UPDATE "RoadmapTask"
SET
  description = $elah$Freeze the full scoring API contract used between the banking simulator and the ELAH scoring service. This includes the pre-tool HTTP request wrapper, the canonical ElahEvent body, the ScoreResponse body, validation errors, idempotency, fail-open behavior, and OpenAPI documentation. This task is the integration agreement that lets Phase 3 build the service, Phase 2 wire simulator events, and Phase 9 bind dashboards without inventing separate shapes.$elah$,
  "successCriteria" = $elah$- Human spec exists for the ElahEvent schema.
- Human spec exists for POST /v1/score input contract.
- Human spec exists for ScoreResponse / ElahScore output contract.
- OpenAPI 3.x page/file defines the score endpoint, request wrapper, response body, and errors.
- Contracts explicitly state that ELAH does not allow, block, confirm, or execute.
- Contracts include accept/reject examples.
- Contracts include fail-open caller behavior for timeout/5xx and non-fail-open behavior for bad payloads.
- Spec chain is visible in Confluence and can be used by an implementer without asking the founder.$elah$,
  deliverables = $elah$- ELAH Event Schema page/document.
- ELAH Input Contract page/document.
- ELAH Output Contract page/document.
- OpenAPI — ELAH v1 Score Endpoint page/file.
- Links from the Technical Specifications index.
- Optional SQL update linking this task to the Confluence spec pages.$elah$,
  notes = $elah$The core documentation for this task is already created in Confluence. Recommended next action: review, then update status to in_review/done when signed.$elah$,
  "updatedAt" = NOW()
WHERE id = $elah$task-3-define-the-scoring-api$elah$;

UPDATE "RoadmapTask"
SET
  description = $elah$Build a deterministic mock implementation of the ELAH scoring service behind POST /v1/score. The mock must validate ScoreRequest, enforce the input/output contracts, and return stable plausible ScoreResponse objects for fixture events before any trained model exists. This unblocks simulator wiring, dashboard binding, investor demos, and baseline comparison. The mock is not the final model; it is a contract-faithful service that behaves consistently enough for integration and demos.$elah$,
  "successCriteria" = $elah$- POST /v1/score accepts valid ScoreRequest contractVersion 1.0 and rejects invalid wrappers/events according to the input contract.
- Service returns ScoreResponse contractVersion 1.0 with elahScore, confidence, uncertainty, intentLabel, coordinates, explanation, policyHook, and provenance.
- Outputs are deterministic for identical eventId/mode/body and respect idempotency rules.
- At least these fixtures produce stable outputs: external transfer, internal transfer, pay bill, statement download, card freeze, support case, balance read, prompt injection, ambiguous request.
- Confidence and uncertainty are complementary.
- policyHook never emits allow/deny/block/confirm.
- Invalid request examples from the input contract fail with the documented codes.
- Mock can run locally with the banking simulator environment.$elah$,
  deliverables = $elah$- Minimal scoring service route for POST /v1/score.
- Deterministic scoring rules/fixture map.
- Idempotency cache or deterministic replay behavior.
- Contract validation using schema helpers.
- Test fixture suite.
- README section: local run, env vars, sample curl, known limitations.$elah$,
  notes = $elah$This should optimize for contract stability and demo reliability, not model sophistication.$elah$,
  "updatedAt" = NOW()
WHERE id = $elah$task-3-create-a-mock-scoring-implementation$elah$;

UPDATE "RoadmapTask"
SET
  description = $elah$Wire the live banking simulator to call the mock ELAH service at the correct pre-tool point. The call must happen after bank policy has allow/deny/confirm context and before assistant tool execution for MVP P0/P1 actions. The simulator must persist the ScoreResponse against the originating eventId, handle timeouts with the documented fail-open behavior, and make the result visible in founder/analyst views. This is the first end-to-end proof that a live assistant action can produce a canonical event and receive an ELAH score.$elah$,
  "successCriteria" = $elah$- Simulator builds a valid ScoreRequest with ElahEvent 1.0 for P0/P1 assistant tool paths.
- Simulator calls POST /v1/score after policy/confirmation state is known and before executeTool for P0 actions.
- Response is stored against requestId and eventId.
- Timeout or 500/503 records scoring_unavailable and continues according to bank policy.
- 4xx contract errors are logged as producer defects and do not pretend a score exists.
- External transfer demo shows: user utterance → planned tool → policy confirmation → ELAH score → tool execution.
- Prompt-injection demo shows refused/blocked event scored and no tool execution.
- Analyst/founder view can display at least eventId, elahScore, intentLabel, coordinates, explanation, and policyHook.$elah$,
  deliverables = $elah$- ELAH API client in the simulator.
- Config/env for ELAH service URL, service token, and client timeout.
- Pre-tool integration point for assistant P0/P1 tools.
- Persistence of ScoreResponse or scoring_unavailable.
- Logs/traces for requestId/eventId correlation.
- Demo script proving the full transfer and injection paths.$elah$,
  notes = $elah$Depends on mock scoring implementation. Must follow 250 ms fail-open handshake from ELAH-SPEC-INPUT-001.$elah$,
  "updatedAt" = NOW()
WHERE id = $elah$task-3-connect-the-existing-banking-simulator-to-the-mo$elah$;

UPDATE "RoadmapTask"
SET
  description = $elah$Define and sign off the closed label taxonomy used to annotate ELAH banking events. This document tells annotators, rules, models, and dashboards exactly what each intent label means, how to choose between overlapping labels, and how to treat prompt injection, ambiguity, non-banking requests, and normal banking actions. The taxonomy is critical because the model cannot learn, the baseline cannot evaluate, and dashboards cannot filter if labels drift.$elah$,
  "successCriteria" = $elah$- Versioned taxonomy document exists.
- The 22 canonical ElahBankingIntent labels are listed with definitions.
- Tie-break rules exist for prompt injection, ambiguity, fraud vs dispute, external transfer vs bill payment, and scheduled payment.
- Annotation guidance exists for confidence, coordinates, and explanation signals.
- Sample annotation record exists.
- QA rules specify how labeled rows are accepted/rejected.
- Document is published in Confluence under Simulator, Data & Training.$elah$,
  deliverables = $elah$- ELAH Label Taxonomy — Banking Intent Labels Markdown file.
- Confluence page under 03 — Simulator, Data & Training.
- Optional SQL update linking the task to the Confluence page and MD artifact.$elah$,
  notes = $elah$Completed as a documentation deliverable in this response; review/sign-off still required before marking done.$elah$,
  "updatedAt" = NOW()
WHERE id = $elah$task-4-define-the-label-taxonomy$elah$;

UPDATE "RoadmapTask"
SET
  description = $elah$Create a labeled pack of synthetic legitimate banking scenarios that represent normal, policy-compliant customer behavior in the simulator. These scenarios are the false-positive control set for ELAH: the model and baseline must learn not to overreact to routine transfers, reads, support cases, statement downloads, and card actions. The pack should be diverse across customer tier, channel, time, amount bucket, tool type, and intent label while staying fully synthetic and privacy-safe.$elah$,
  "successCriteria" = $elah$- Scenario pack contains at least 200 legitimate banking events before model training begins.
- Coverage includes P0 actions: internal transfer, external transfer, bill payment, card freeze/unfreeze, statement download.
- Coverage includes P1 actions: balance read, recent transactions, transaction lookup, spending summary, cards read, recipients read, support case.
- Each scenario has ElahEvent-compatible fields and a label-taxonomy-compatible intentLabel.
- Dataset includes low/medium/high financialRisk examples that are still genuine.
- Dataset includes UI vs agent twins for at least external transfer and statement download.
- No real PII, account numbers, card numbers, or real customer data.
- Train/validation/holdout split is documented.$elah$,
  deliverables = $elah$- Synthetic legitimate scenario JSON/JSONL file.
- Optional spreadsheet or CSV preview for manual inspection.
- Data dictionary and generation notes.
- Label distribution summary.
- At least 10 examples per common P0/P1 class.
- Link to the label taxonomy version used.$elah$,
  notes = $elah$Do this after label taxonomy sign-off. This is a data deliverable, not only a document.$elah$,
  "updatedAt" = NOW()
WHERE id = $elah$task-4-create-synthetic-legitimate-banking-scenarios$elah$;

UPDATE "RoadmapTask"
SET
  description = $elah$Implement the first deterministic ELAH baseline scorer using transparent rules rather than a learned model. The baseline must produce contract-valid ScoreResponse objects from ElahEvent inputs, using explicit signals such as actionType, toolName, policy decision, confirmation state, amount bucket, account context, source, prompt-injection signals, and ambiguity. This baseline is the MVP safety net: it gives explainable scores while the trained model is still under development and creates a measurable bar the model must beat.$elah$,
  "successCriteria" = $elah$- Baseline accepts normalized ElahEvent records and emits ScoreResponse v1.0.
- Rules cover all P0/P1 assistant action types and prompt-injection/no-tool events.
- Rules output elahScore, confidence, uncertainty, intentLabel, coordinates, explanation arrays, policyHook, and provenance.
- Prompt-injection/policy-bypass examples score low with review recommendation.
- Legitimate P0 actions can score high while still carrying high financialRisk/watch recommendation.
- Baseline is evaluated on a golden set with precision, recall, false positives, and false negatives.
- First trained model has a documented baseline to beat.
- Rules are deterministic and testable.$elah$,
  deliverables = $elah$- Baseline scoring module.
- Signal extraction helper.
- Rule table or config file.
- Unit tests for every P0/P1 action class.
- Evaluation report on golden set.
- Documentation of known failure modes and thresholds.
- Integration with POST /v1/score mock or replacement path.$elah$,
  notes = $elah$Should build on label taxonomy and scenario pack. This is the first explainable scorer, not the final trained model.$elah$,
  "updatedAt" = NOW()
WHERE id = $elah$task-5-build-a-deterministic-rules-based-baseline$elah$;

UPDATE "RoadmapTask"
SET
  description = $elah$Conduct structured banking-domain interviews with people who understand assistant-driven banking workflows, fraud/security operations, payments, digital banking, AI governance, or customer support automation. The goal is to validate ELAH's product boundary: scoring genuine customer intent after bank policy and before assistant tool execution, without replacing fraud or policy engines. Interviews should test workflow realism, buyer identity, integration feasibility, false-positive sensitivity, and whether the live simulator demo tells a credible story.$elah$,
  "successCriteria" = $elah$- Interview guide exists and is published.
- At least 5 interviews are completed.
- Interviewees include at least 2 profiles such as product, fraud/SOC, payments ops, AI governance, or digital banking.
- Notes are captured using a consistent template.
- Each interview records problem resonance, buyer clarity, integration credibility, false-positive concern, and demo credibility.
- Founder summary identifies validated assumptions, invalidated assumptions, red flags, and required product/demo changes.
- At least 3 follow-up contacts or pilot leads are requested.$elah$,
  deliverables = $elah$- ELAH Banking Domain Interview Guide Markdown file.
- Confluence page under 05 — Demos, GTM & Investor Materials.
- Interview notes template.
- Founder-facing synthesis after interviews.
- Updated demo/product assumptions based on repeated feedback.$elah$,
  notes = $elah$Completed as a documentation prep deliverable in this response; actual interviews remain to be conducted.$elah$,
  "updatedAt" = NOW()
WHERE id = $elah$task-11-conduct-banking-domain-interviews$elah$;
```

*End of document.*
