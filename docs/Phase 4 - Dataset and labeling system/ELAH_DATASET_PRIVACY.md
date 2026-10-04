# ELAH Dataset Privacy (Phase 4)

| Field | Value |
|---|---|
| Document ID | ELAH-DATA-PRIV-001 |
| Version | **1.0** |
| Status | Proposed for sign-off |
| Date | 26 August 2026 |
| Related tasks | `task-4-review-privacy-and-anonymization-requirements` |
| Depends on | `ELAH-SPEC-PRIVACY-001`, `ELAH-SPEC-EVENT-001` §6, `ELAH-DATA-TRAIN-001` |

**Product freeze (unchanged):** ELAH scores genuine banking intent before tool execution. Bank policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** Jane / customer UI MUST NOT show `elahScore`, confidence, coordinates, or gold tags.

---

## 1. Map from `ELAH-SPEC-PRIVACY-001`

| Data class (privacy spec) | Live `ElahEvent` / `POST /v1/score` | Phase 4 gold JSONL |
|---|---|---|
| Identifiers (`userId`) | Hash only (`userIdHash`) | Fake 32-hex hash on synthetic rows; never raw user id |
| Action metadata | Yes | Yes |
| Amounts / currency | Yes | Yes |
| Payee / account numbers | Hash or omit | Redact; no IBAN / last4 / real names in args |
| Raw utterance | Privacy spec: **no** on v1 live envelope. Event schema still has optional capped `utterance` if already present (Phase 2 export does not add it) | **Synthetic fictional utterances allowed** on gold. Converted live logs must **not add** chat the envelope did not already have |
| Auth secrets | Transport only | Never in JSONL |
| Score outputs | Founder + analyst only | `goldScore` on the record, **not** on `event`. Never shown to Jane |

Demo accounts are still treated as if they were customer data in **logs**. Synthetic packs must not copy live DB dumps into git.

---

## 2. Who sees what (Phase 4)

| Role | Sees `elahScore` / gold scores | Sees utterances |
|---|---|---|
| Jane / customer (`/assistant`) | **No** | Own chat only |
| `security.admin` labeling UI | Yes (analyst) | Synthetic gold; simulator transcripts only if the app already stores them |
| Founder | Training features + scores | Synthetic gold rows |
| ELAH service logs | ids + latency | No utterance |

---

## 3. Forbidden keys (`action.args`)

Same closed list as ElahEvent 1.0 §6 / `TRAINING_FORBIDDEN_ARG_KEYS`:

```text
userId
customerProfileId
profileId
actorId
sessionId
accountId
fromAccountId
toAccountId
ownerId
targetUserId
password
token
role
cardId
```

Also reject: unredacted recipient/name strings, digit runs ≥ 8 (unless already `[redacted_account_number]`), email-like strings in notes/args, chain-of-thought.

---

## 4. What you must not publish or commit

- Live database dumps (`ElahTrainingEvent`, `AuditLog`, `AgentEventLog`) with real-looking PII from `seed-from-dataset` or production-like data.
- Raw Bearer tokens, passwords, card numbers.
- Customer-facing screenshots that show `elahScore`.
- Gold files that smuggle live chat copied from a DB export.

Retention: gold v1.0 is synthetic. Converted logs follow Phase 0 retention (`ELAH-SPEC-RETENTION-001`).

Legal counsel sign-off of a **real-customer** dataset is out of this MVP (no real customers).

---

## 5. Sign-off

| Role | Name | Date | Decision |
|---|---|---|---|
| Product / Founder |  |  | Approve / Approve with comments / Reject |
| Security |  |  |  |
| Data |  |  |  |

**Approval statement:** I agree Phase 4 gold files follow `ELAH-SPEC-PRIVACY-001`; that Jane never sees scores; that synthetic utterances are allowed on gold while live envelopes must not add raw chat the schema/privacy rules forbid; that forbidden arg keys stay stripped; and that live DB dumps are not committed.

---

*End of document.*
