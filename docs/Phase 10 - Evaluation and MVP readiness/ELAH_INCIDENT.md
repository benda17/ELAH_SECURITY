# ELAH incident procedures (Phase 10)

| Field | Value |
|---|---|
| Document ID | ELAH-P10-INC-001 |
| Version | **1.0** |
| Status | **Proposed** |
| Date | 28 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related task | `task-10-document-incident-procedures` |

**Product freeze (unchanged):** Scorer down = **fail-open**. It is **not** “ELAH blocked the bank.” Do not silently hide unavailable scores on the analyst UI.

---

## 1. Severity (demo MVP)

| Class | Example | Immediate action |
|---|---|---|
| S1 | Customer UI shows `elahScore` | Revert deploy; keep Jane score-free; treat as product-freeze breach |
| S1 | Scorer starts **blocking** tools | Revert; restore policy-only path |
| S2 | `scoring_unavailable` spike | Say fail-open in the demo; check `ELAH_SERVICE_TOKEN` / timeout; tools still follow policy |
| S2 | Wrong-DB `prisma db push` | **Stop.** Restore from Neon; do not “fix forward” by dropping columns |
| S3 | Analyst dashboard empty | Check session/role; not a banking outage |

There is no 24/7 on-call. The founder is the operator.

---

## 2. Comms

- **Say:** “ELAH is unavailable; the bank/company policy still ran.”
- **Never say:** “ELAH blocked it because we were down.”
- Do not invent a score on the card to save a demo.

---

## 3. After

1. Preserve `requestId` / `eventId` log lines.
2. Do not paste secrets into chat.
3. File a Kanban note; do not mark Phase 8 Done.

---

## 4. Sign-off

I agree incidents fail open, never impersonate bank policy, and never leak scores to Jane to “fix” a demo.

---

*End of document.*
