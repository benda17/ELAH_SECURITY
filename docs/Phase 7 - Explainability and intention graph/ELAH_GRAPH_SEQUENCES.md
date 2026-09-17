# ELAH graph sequences, trajectories, and deviations

| Field | Value |
|---|---|
| Document ID | ELAH-P7-SEQ-001 |
| Version | **0.1** |
| Status | **Approved — Founder, 17 September 2026** |
| Date | 16 September 2026 |
| Classification | Internal — ELAH Security |
| Owner | Founder |
| Related tasks | `task-7-define-how-action-sequences-appear-on-the-graph`; `task-7-display-action-trajectories`; `task-7-display-user-request-to-agent-action-relationshi`; `task-7-display-deviations-from-expected-behavior` |
| Depends on | `ELAH-P7-DIM-001`, `ELAH-P7-CALC-001`, `ELAH-SPEC-EVENT-001`, `ELAH-WEDGE-FREEZE-001` |
| Canonical path | `docs/Phase 7 - Explainability and intention graph/ELAH_GRAPH_SEQUENCES.md` |

**Product freeze (unchanged):** ELAH scores genuine support/CRM intent **before tools**. Company policy allow / deny / confirm. **ELAH never allows, blocks, or executes.** A trajectory is **not** a policy decision. Customer / support-user UI MUST NOT show the graph.

First consumer: CS/CRM ops analyst. Banking sequences may reuse the same drawing rules on the demo cube later; do not treat Jane’s transfer path as the first-buyer story.

---

## 1. Purpose

A single point is one scored action. CS/CRM work happens in **conversations**: user ask → planned tool → (policy) → score → maybe execute. This document freezes how those sequences appear on the **same** three-axis cube (no time axis, no fourth numeric axis).

---

## 2. Grouping and order

| Key | Rule |
|---|---|
| Thread | `conversationId` (required to draw a trajectory) |
| Point identity | `eventId` (one scored unit) |
| Order | `occurredAt`, tie-break `metadata.sequence` if present |
| Domain filter | `appId` / CS vs banking — do not mix threads on one path |
| Missing conversation | Draw **points only**; do not invent a polyline |

Cap a drawn path at a renderer budget (suggested: last **20** scored events in the thread). Older points may remain as faded dots without edges.

Do not draw a path across users. Do not join UI and agent **twins** into one polyline just because they share `twinGroupId` — twins are two `eventId`s that **share coordinates** (within 0.05) and differ by `source`.

---

## 3. Trajectories (Layer B)

**Display action trajectories:** a polyline through scored points in the thread, in time order.

| Visual | Rule |
|---|---|
| Stroke | Thin, same risk-colour family as the **latest** point or a neutral ink; not a new axis |
| Direction | Optional arrowhead on the last segment |
| Z | 3-D: line through cube space. 2-D: project X/Y; ignore bubble size for the stroke |
| Abstain | Keep the vertex; use the abstain glyph at that vertex (`ELAH-P7-VIS-001`) |
| Score unavailable | **Skip** the vertex (no invented coordinate) |
| Jitter | Apply `spreadIntentPoints` **after** grouping so stacked same-intent steps do not hide; do not persist |

The path **explains sequence**. It does not mean “ELAH steered the agent” and it does not mean “ELAH allowed the next tool.”

Current implementation (17 September 2026): founder `/banking/crm` draws recent trajectories grouped by `conversationId`; the banking demo remains primarily a point cloud.

---

## 4. User-request → agent-action edge

**Display user-request-to-agent-action relationships:** an explicit edge from the scored **request** to the scored **planned tool**, inside the same conversation turn when both exist.

| End | Typical event | Coordinate |
|---|---|---|
| Request | User utterance / `user_message_received` (or the pre-tool envelope for that turn) | Atlas for the **user** intent if scored; if only the tool-plan is scored, this end is omitted — do not invent a second point |
| Action | `tool_call_requested` (pre-`executeTool`) | Atlas for `intentLabel` on that snapshot |

Drawing:

```text
request point  ──dashed──▶  tool-plan point
```

| Case | Draw |
|---|---|
| Same label, twins (ui vs agent) | Two points nearly coincident; **no** request→tool arrow required; caption `source` |
| Genuine refund: user asked refund, agent planned refund | Short edge (often visually short because atlas cells match) |
| `mistaken_agent`: user ticket-status, agent planned `profile_update` | **Long** edge across the cube — this **is** the relationship |
| Injection: no tool executed | Request (and/or plan) point only; policy refuse is **policy**, not an ELAH block. Still draw the scored point |
| Policy deny before execute | Still draw the pre-tool scored action point; do not delete it because the tool did not run |

ELAH still runs **before** the tool. The edge is “what was asked” vs “what was about to run,” not “ELAH executed.”

Do not attach CoT text to the edge. Caption MAY be `intentLabel` + `toolName` (allow-listed names only).

---

## 5. Deviations from expected behavior

**Expected** for this wedge: a genuine CS/CRM ask sits near its atlas cell; a planned allow-listed tool matches that family; policy still allow / deny / confirm independently.

Mark a **deviation** (overlay, not a new axis) when any of these hold. Use a distinct glyph or stroke (suggested: dashed amber) plus panel copy — never “ELAH blocked.”

| Pattern | Signal (structured) | Graph |
|---|---|---|
| Wrong tool | `intentLabel = mistaken_agent` **or** planner `detectedIntent` disagrees with planned tool family | Request→tool edge spans regions |
| Injection / bypass | `intentLabel = prompt_injection_or_policy_bypass` and/or `RC_INTENT_INJECTION` / injection negativeSignals | Jump to low-X high-Y |
| Exfil / overwrite / abuse | Labels `data_exfil_ticket_export`, `unauthorized_crm_overwrite`, `refund_abuse` | Low/mid X, high Y; not “fraudster” caption |
| FR spike in-thread | Consecutive points: Δ FR ≥ **0.35** (e.g. ticket_status → refund_request) | Highlight that segment; genuine refund after a status ask can still be **legitimate** — panel must say so |
| Abstain / conflict | `status = abstained` or `RC_CONFLICTING_SIGNALS` | Hollow vertex; do not call it an attack |
| Off-domain | `non_crm_request` | Near origin |

**Not a deviation:** high FR on `refund_request` with high HA. That is the expected genuine-refund region (`ELAH-P7-AXES-001`).

Do not infer deviations from chain-of-thought or from unlabeled Zendesk. Do not invent a “behavior_drift” banking pack on this graph.

---

## 6. Three-layer placement

Sequences are **Layer B** of `ELAH-P7-VIS-001`:

1. Layer A — points  
2. Layer B — this document (polylines + request→tool edges + deviation strokes)  
3. Layer C — evidence on the selected point (`ELAH-P7-PANEL-001`)

Toggle Layer B off for a dense cloud. Default on when a single `conversationId` is in focus.

---

## 7. Say / never say

**Say**

- “Path is this conversation’s scored steps, in time.”
- “The dashed arrow is the user ask versus the tool the assistant planned.”
- “ELAH scored before the tool. Company policy decided whether it ran.”

**Never say**

- “The line is ELAH steering the bot.”
- “A jump means we blocked them.”
- Drawing trajectories on customer chat.

---

## 8. Sign-off

| Role | Decision | Date | Notes |
|---|---|---|---|
| Founder | **Approve** | 17 September 2026 | Trajectories by `conversationId`; request→tool edge; deviations as overlay. |

Options: **Approve** / **Approve with comments** / **Reject**.

**Approval statement:** I agree sequences are polylines on the existing cube grouped by `conversationId`; that request→tool is an edge, not a fourth axis; that high-FR genuine refunds are not deviations; and that ELAH still never allows, blocks, or executes.

---

*End of document.*
