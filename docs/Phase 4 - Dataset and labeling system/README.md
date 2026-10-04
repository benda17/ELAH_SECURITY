# Phase 4 — Dataset and labeling system (documentation)

Canonical **documentation** pack for Phase 4. Gold JSONL types live in `lib/elah/dataset/schema.ts` and `lib/elah/dataset/template.ts`. **Phase 4 does not train a model and does not change bank policy.** Prisma `ElahTrainingEvent` remains the live assistant-turn store; gold JSONL is a **different** schema. Do not `prisma db push`.

**Product freeze (unchanged):** ELAH scores genuine banking intent **before tool execution**. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Scores are **not** fields of `ElahEvent`. Jane / customer UI MUST NOT show `elahScore`. Do not invent ATM tools, beneficiary-write, or `device_change` product events.

Evidence date: **26 August 2026**, live repo `ELAH_SECURITY---Banking-System`.

Canonical demo users: `basic.customer@elah.demo` (Jane), `premium.customer@elah.demo`, `vip.customer@elah.demo` (Isabella), `manager@elah.demo`, `security.admin@elah.demo`.

This pack maps all **41** Phase 4 Kanban cards.

**How to run**

```bash
npm run dataset:generate          # rewrite data/phase4/v1.0 (seed 20260826)
npm run normalize:elah-logs       # unlabeled JSONL from live simulator logs
npm run dataset:iaa               # Cohen’s κ on the overlap fixture
npm run test:phase4-dataset       # 30 unit tests
```

Labeling UI: `/admin/elah-labeling` as `security.admin@elah.demo` / `DemoPass123!`.

---

## Index

| Order | Task | Task id | Doc ID | File |
|---:|---|---|---|---|
| 1 | Define the training-data schema. | `task-4-define-the-training-data-schema` | ELAH-DATA-TRAIN-001 | [ELAH_TRAINING_SCHEMA.md](./ELAH_TRAINING_SCHEMA.md) |
| 2 | Define the evaluation-data schema. | `task-4-define-the-evaluation-data-schema` | ELAH-DATA-EVAL-001 | [ELAH_EVALUATION_SCHEMA.md](./ELAH_EVALUATION_SCHEMA.md) |
| 3 | Define the label taxonomy. | `task-4-define-the-label-taxonomy` | ELAH-SPEC-LABEL-TAXONOMY-001 | [ELAH_LABEL_TAXONOMY.md](./ELAH_LABEL_TAXONOMY.md) |
| 4 | Define human-intention dimensions. | `task-4-define-human-intention-dimensions` | ELAH-DATA-DIM-001 | [ELAH_INTENTION_DIMENSIONS.md](./ELAH_INTENTION_DIMENSIONS.md) |
| 5 | Define malicious-intent dimensions. | `task-4-define-malicious-intent-dimensions` | ELAH-DATA-DIM-001 | [ELAH_INTENTION_DIMENSIONS.md](./ELAH_INTENTION_DIMENSIONS.md) |
| 6 | Define accidental-error dimensions. | `task-4-define-accidental-error-dimensions` | ELAH-DATA-DIM-001 | [ELAH_INTENTION_DIMENSIONS.md](./ELAH_INTENTION_DIMENSIONS.md) |
| 7 | Define ambiguity labels. | `task-4-define-ambiguity-labels` | ELAH-DATA-AMBIG-001 | [ELAH_AMBIGUITY_LABELS.md](./ELAH_AMBIGUITY_LABELS.md) |
| 8 | Define confidence labels. | `task-4-define-confidence-labels` | ELAH-DATA-ANN-CONF-001 | [ELAH_CONFIDENCE_LABELS.md](./ELAH_CONFIDENCE_LABELS.md) |
| 9 | Define contextual-risk labels. | `task-4-define-contextual-risk-labels` | ELAH-DATA-CTX-001 | [ELAH_CONTEXTUAL_RISK_LABELS.md](./ELAH_CONTEXTUAL_RISK_LABELS.md) |
| 10 | Create a scenario-template format. | `task-4-create-a-scenario-template-format` | ELAH-DATA-TPL-001 | [ELAH_SCENARIO_TEMPLATE.md](./ELAH_SCENARIO_TEMPLATE.md) |
| 11 | Convert existing simulator logs into the normalized schema. | `task-4-convert-existing-simulator-logs-into-the-normali` | ELAH-DATA-NORM-001 | [ELAH_LOG_NORMALIZATION.md](./ELAH_LOG_NORMALIZATION.md) |
| 12 | Clean existing logs. | `task-4-clean-existing-logs` | ELAH-DATA-NORM-001 | [ELAH_LOG_NORMALIZATION.md](./ELAH_LOG_NORMALIZATION.md) |
| 13 | Remove duplicate records. | `task-4-remove-duplicate-records` | ELAH-DATA-NORM-001 | [ELAH_LOG_NORMALIZATION.md](./ELAH_LOG_NORMALIZATION.md) |
| 14 | Validate timestamps and ordering. | `task-4-validate-timestamps-and-ordering` | ELAH-DATA-NORM-001 | [ELAH_LOG_NORMALIZATION.md](./ELAH_LOG_NORMALIZATION.md) |
| 15 | Detect incomplete examples. | `task-4-detect-incomplete-examples` | ELAH-DATA-NORM-001 | [ELAH_LOG_NORMALIZATION.md](./ELAH_LOG_NORMALIZATION.md) |
| 16 | Create synthetic legitimate banking scenarios. | `task-4-create-synthetic-legitimate-banking-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 17 | Create synthetic suspicious banking scenarios. | `task-4-create-synthetic-suspicious-banking-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 18 | Create synthetic malicious banking scenarios. | `task-4-create-synthetic-malicious-banking-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 19 | Create synthetic ambiguous scenarios. | `task-4-create-synthetic-ambiguous-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 20 | Create multi-step agent scenarios. | `task-4-create-multi-step-agent-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 21 | Create prompt-injection scenarios. | `task-4-create-prompt-injection-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 22 | Create indirect prompt-injection scenarios. | `task-4-create-indirect-prompt-injection-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 23 | Create compromised-tool scenarios. | `task-4-create-compromised-tool-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 24 | Create excessive-permission scenarios. | `task-4-create-excessive-permission-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 25 | Create mistaken-user scenarios. | `task-4-create-mistaken-user-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 26 | Create conflicting-instruction scenarios. | `task-4-create-conflicting-instruction-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 27 | Create authorization-boundary scenarios. | `task-4-create-authorization-boundary-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 28 | Create data-exfiltration scenarios. | `task-4-create-data-exfiltration-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 29 | Create high-value transfer scenarios. | `task-4-create-high-value-transfer-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 30 | Create unusual-device scenarios. | `task-4-create-unusual-device-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 31 | Create unusual-location scenarios. | `task-4-create-unusual-location-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 32 | Create behavior-drift scenarios. | `task-4-create-behavior-drift-scenarios` | ELAH-DATA-SYNTH-001 | [ELAH_SYNTHETIC_SCENARIOS.md](./ELAH_SYNTHETIC_SCENARIOS.md) |
| 33 | Create a manual labeling interface. | `task-4-create-a-manual-labeling-interface` | ELAH-DATA-UI-001 | [ELAH_LABELING_INTERFACE.md](./ELAH_LABELING_INTERFACE.md) |
| 34 | Add reviewer notes. | `task-4-add-reviewer-notes` | ELAH-DATA-UI-001 | [ELAH_LABELING_INTERFACE.md](./ELAH_LABELING_INTERFACE.md) |
| 35 | Add labeling guidelines. | `task-4-add-labeling-guidelines` | ELAH-DATA-GUIDE-001 | [ELAH_LABELING_GUIDELINES.md](./ELAH_LABELING_GUIDELINES.md) |
| 36 | Two-person labeling packet | `task-4-add-inter-reviewer-agreement-tracking` | ELAH-DATA-IAA-PACKET-001 | [ELAH_IAA_OVERLAP_PACKET.md](./ELAH_IAA_OVERLAP_PACKET.md) |
| 37 | Add dataset versioning. | `task-4-add-dataset-versioning` | ELAH-DATA-VER-001 | [ELAH_DATASET_VERSIONING.md](./ELAH_DATASET_VERSIONING.md) |
| 38 | Split data into training, validation, and holdout test sets. | `task-4-split-data-into-training-validation-and-holdout-` | ELAH-DATA-VER-001 | [ELAH_DATASET_VERSIONING.md](./ELAH_DATASET_VERSIONING.md) |
| 39 | Prevent scenario leakage between splits. | `task-4-prevent-scenario-leakage-between-splits` | ELAH-DATA-VER-001 | [ELAH_DATASET_VERSIONING.md](./ELAH_DATASET_VERSIONING.md) |
| 40 | Track data provenance. | `task-4-track-data-provenance` | ELAH-DATA-VER-001 | [ELAH_DATASET_VERSIONING.md](./ELAH_DATASET_VERSIONING.md) |
| 41 | Review privacy and anonymization requirements. | `task-4-review-privacy-and-anonymization-requirements` | ELAH-DATA-PRIV-001 | [ELAH_DATASET_PRIVACY.md](./ELAH_DATASET_PRIVACY.md) |
| — | Founder executive summary | — | — | [ELAH_PHASE4_EXECUTIVE_SUMMARY.md](./ELAH_PHASE4_EXECUTIVE_SUMMARY.md) |

Closed 22 `ElahBankingIntent` labels: `lib/elah/types.ts`. Gold types: `lib/elah/dataset/schema.ts`. Scenario compile: `lib/elah/dataset/template.ts`.

---

## How to read

1. **Training / eval schemas** — gold row on top of `ElahEvent` 1.0; scores are labels, not envelope fields.
2. **Taxonomy + dimensions + tags** — one `intentLabel` from the 22; coordinates; contextual tags; annotator confidence.
3. **Template** — how synthetic scenarios compile to gold rows.
4. **Normalization, packs, labeling UI, versioning** — live in this folder (log normalize, synthetic JSONL, `/admin/elah-labeling`, manifest + splits).
5. **Privacy** — Jane never sees scores; synthetic utterances allowed on gold; no live DB dumps in git.

Related Phase 3 pack: `docs/Phase 3 - ELAH service foundation/`. Related Phase 0 pack: `docs/Phase 0 - Product Definition/`. Related Phase 2 export: `docs/Phase 2 - Agent observability and event collection/ELAH_TRAINING_EXPORT.md`.

---

*End of document.*
