# ELAH Banking MVP — Exit Criteria

Measurable conditions for internal MVP readiness (Milestone 10).

Product-definition metrics (Phase 0) live in **`docs/Phase 0 - Product Definition/Tasks 10-22 performed 17 Aug 2026/ELAH_MVP_SUCCESS_METRICS.md`**. Keep this checklist in sync with that document and with MVP scope §9.

## Scoring

- [ ] ELAH returns numeric score 0.00–1.00 for every scored event  
- [ ] Confidence/uncertainty field present on every response  
- [ ] Intention coordinates returned (Human Agency, Financial Risk, Emotional Urgency)  
- [ ] Human-readable explanation with evidence list (no raw chain-of-thought)  
- [ ] Bank-configurable thresholds documented; ELAH does not allow/block  

## Data & events

- [ ] Normalized event envelope for all banking + agent actions  
- [ ] Unique event IDs, timestamps, session/user/device context  
- [ ] Agent-triggered vs user-triggered actions distinguishable  
- [ ] ≥200 labeled scenarios with train/val/holdout split  

## Model

- [ ] Rules baseline evaluated on golden set with FP/FN/precision/recall  
- [ ] First trained model beats baseline on holdout  
- [ ] Calibration documented; abstention path for low confidence  

## Security

- [ ] Threat model complete  
- [ ] Red-team scenario catalog executed; critical findings remediated or accepted  

## Product

- [ ] Analyst dashboard: event list, detail, score, graph, filters, export  
- [ ] End-to-end demo script (technical + non-technical)  
- [ ] MVP readiness report with known limitations  

## Pilot readiness (separate milestone)

- [ ] Design partner identified (not fabricated)  
- [ ] Pilot scope, success metrics, integration plan agreed  
- [ ] Security + data-processing docs for customer review  

## Not required for internal MVP

- Public App Store release  
- Production multi-tenant deployment  
- Full regulatory certification  
