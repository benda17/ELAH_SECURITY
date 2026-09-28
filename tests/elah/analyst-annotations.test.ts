import { afterEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/db";
import {
  parseFeedbackInput,
  parseNoteInput,
  parseOutcomeMarkInput,
  parseReviewStatusInput,
  parseViewName,
  sanitizeAnalystText,
  viewIdFromName,
} from "@/lib/elah/analyst/validation";
import {
  addAnalystNote,
  foldEventAnnotations,
  foldReviewStates,
  getReviewStates,
  setReviewStatus,
  submitFeedback,
} from "@/lib/elah/analyst/annotations";
import { foldSavedViews } from "@/lib/elah/analyst/saved-views";
import { ELAH_ANALYST_ACTION_TYPES as T, type AnalystActor } from "@/lib/elah/analyst/constants";
import type { AnalystAuditRow } from "@/lib/elah/analyst/store";

const EVENT_ID = "evt_annot_0001";
const actor: AnalystActor = { id: "user_sec", name: "Sec Reviewer", role: "security_reviewer" };

function row(
  actionType: string,
  payload: Record<string, unknown>,
  at: string,
  overrides: Partial<AnalystAuditRow> = {},
): AnalystAuditRow {
  return {
    id: `row_${actionType}_${at}`,
    timestamp: new Date(at),
    actionType,
    eventId: EVENT_ID,
    actorId: actor.id,
    actorName: actor.name,
    role: actor.role,
    inputDataSummary: JSON.stringify({ v: 1, ...payload }),
    ...overrides,
  };
}

describe("analyst input validation", () => {
  it("redacts emails and long digit runs, strips control chars", () => {
    expect(
      sanitizeAnalystText(" Call 054-123-4567 or mail dana@bank.co.il re acct 12345678\u0007 "),
    ).toBe("Call [redacted_number] or mail [redacted_email] re acct [redacted_number]");
    expect(sanitizeAnalystText("amount 500 on card ending 1234")).toBe(
      "amount 500 on card ending 1234",
    );
  });

  it("validates notes", () => {
    expect(parseNoteInput({ eventId: EVENT_ID, text: "Looks legit" })).toEqual({
      ok: true,
      value: { eventId: EVENT_ID, text: "Looks legit" },
    });
    expect(parseNoteInput({ eventId: EVENT_ID, text: "   " }).ok).toBe(false);
    expect(parseNoteInput({ eventId: EVENT_ID, text: "x".repeat(2001) }).ok).toBe(false);
    expect(parseNoteInput({ eventId: EVENT_ID, text: "x".repeat(2000) }).ok).toBe(true);
    expect(parseNoteInput({ eventId: "bad id!", text: "ok" }).ok).toBe(false);
    expect(parseNoteInput({ eventId: "short", text: "ok" }).ok).toBe(false);
    expect(parseNoteInput({ eventId: EVENT_ID, text: 42 }).ok).toBe(false);
    expect(parseNoteInput({ eventId: EVENT_ID, text: "ok", extra: 1 }).ok).toBe(false);
    expect(parseNoteInput(null).ok).toBe(false);
  });

  it("validates review status and outcome marks", () => {
    expect(parseReviewStatusInput({ eventId: EVENT_ID, status: "escalated" }).ok).toBe(true);
    expect(parseReviewStatusInput({ eventId: EVENT_ID, status: "closed" }).ok).toBe(false);
    expect(parseOutcomeMarkInput({ eventId: EVENT_ID, mark: "false_positive" }).ok).toBe(true);
    expect(parseOutcomeMarkInput({ eventId: EVENT_ID, mark: null }).ok).toBe(true);
    expect(parseOutcomeMarkInput({ eventId: EVENT_ID, mark: "true_negative" }).ok).toBe(false);
    expect(parseOutcomeMarkInput({ eventId: EVENT_ID }).ok).toBe(false);
  });

  it("validates feedback rating, text, and closed-taxonomy label", () => {
    expect(
      parseFeedbackInput({ eventId: EVENT_ID, rating: 4, suggestedIntentLabel: "bill_payment" }),
    ).toEqual({
      ok: true,
      value: { eventId: EVENT_ID, rating: 4, suggestedIntentLabel: "bill_payment" },
    });
    expect(parseFeedbackInput({ eventId: EVENT_ID, rating: "5" }).ok).toBe(true);
    for (const rating of [0, 6, 2.5, "abc", null]) {
      expect(parseFeedbackInput({ eventId: EVENT_ID, rating }).ok).toBe(false);
    }
    expect(
      parseFeedbackInput({ eventId: EVENT_ID, rating: 3, suggestedIntentLabel: "wire_fraud" }).ok,
    ).toBe(false);
    expect(parseFeedbackInput({ eventId: EVENT_ID, rating: 3, text: "y".repeat(2001) }).ok).toBe(
      false,
    );
  });

  it("validates saved view names", () => {
    expect(parseViewName("  Low   score agent  ")).toEqual({ ok: true, value: "Low score agent" });
    expect(parseViewName("").ok).toBe(false);
    expect(parseViewName("x".repeat(81)).ok).toBe(false);
    expect(viewIdFromName("Low score agent!")).toBe("low-score-agent");
    expect(viewIdFromName("!!!")).toBe("view");
  });
});

describe("annotation writes", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects invalid input without touching the DB", async () => {
    const create = vi.spyOn(prisma.auditLog, "create");
    const findFirst = vi.spyOn(prisma.auditLog, "findFirst");
    const result = await setReviewStatus(actor, { eventId: EVENT_ID, status: "done" as never });
    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
    expect(findFirst).not.toHaveBeenCalled();
  });

  it("rejects unknown events", async () => {
    vi.spyOn(prisma.auditLog, "findFirst").mockResolvedValue(null);
    const create = vi.spyOn(prisma.auditLog, "create");
    const result = await addAnalystNote(actor, { eventId: EVENT_ID, text: "hello" });
    expect(result).toEqual({ ok: false, error: "No ElahEvent with this eventId." });
    expect(create).not.toHaveBeenCalled();
  });

  it("appends a sanitized note row keyed by eventId", async () => {
    vi.spyOn(prisma.auditLog, "findFirst").mockResolvedValue({ id: "ingest_1" } as never);
    const create = vi.spyOn(prisma.auditLog, "create").mockImplementation(((args: {
      data: Record<string, unknown>;
    }) =>
      Promise.resolve({
        id: "note_1",
        timestamp: new Date("2026-09-28T08:00:00.000Z"),
        ...args.data,
      })) as never);

    const result = await addAnalystNote(actor, {
      eventId: EVENT_ID,
      text: "Customer card 4580123412341234 looks fine",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.text).toBe("Customer card [redacted_number] looks fine");

    const data = create.mock.calls[0]![0].data;
    expect(data.actionType).toBe(T.NOTE_ADDED);
    expect(data.eventId).toBe(EVENT_ID);
    expect(data.actorId).toBe(actor.id);
    expect(data.role).toBe("security_reviewer");
    expect(data.source).toBe("system");
    expect(data.userIdHash).toBeNull();
    expect(String(data.inputDataSummary)).not.toContain("4580");
    expect(JSON.parse(String(data.inputDataSummary))).toEqual({
      v: 1,
      text: "Customer card [redacted_number] looks fine",
    });
  });

  it("stores feedback with a null label when omitted", async () => {
    vi.spyOn(prisma.auditLog, "findFirst").mockResolvedValue({ id: "ingest_1" } as never);
    const create = vi.spyOn(prisma.auditLog, "create").mockImplementation(((args: {
      data: Record<string, unknown>;
    }) => Promise.resolve({ id: "fb_1", timestamp: new Date(), ...args.data })) as never);
    const result = await submitFeedback(actor, { eventId: EVENT_ID, rating: 2 });
    expect(result.ok && result.value.suggestedIntentLabel).toBeNull();
    expect(JSON.parse(String(create.mock.calls[0]![0].data.inputDataSummary))).toEqual({
      v: 1,
      rating: 2,
      text: null,
      suggestedIntentLabel: null,
    });
  });
});

describe("annotation reads (latest wins)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const rows = [
    row(T.REVIEW_STATUS_SET, { status: "reviewed" }, "2026-09-28T09:00:00.000Z"),
    row(T.NOTE_ADDED, { text: "first" }, "2026-09-28T08:00:00.000Z"),
    row(T.REVIEW_STATUS_SET, { status: "in_review" }, "2026-09-28T08:30:00.000Z"),
    row(T.OUTCOME_MARKED, { mark: "false_positive", reason: null }, "2026-09-28T08:40:00.000Z"),
    row(T.OUTCOME_MARKED, { mark: null, reason: null }, "2026-09-28T09:10:00.000Z"),
    row(T.OUTCOME_MARKED, { mark: "false_negative", reason: "missed" }, "2026-09-28T09:20:00.000Z"),
    row(T.FEEDBACK_SUBMITTED, { rating: 4, text: null, suggestedIntentLabel: "bill_payment" }, "2026-09-28T09:30:00.000Z"),
    row(T.FEEDBACK_SUBMITTED, { rating: 9 }, "2026-09-28T09:31:00.000Z"),
    row(T.REVIEW_STATUS_SET, { status: "bogus" }, "2026-09-28T09:40:00.000Z"),
    row(T.NOTE_ADDED, { text: "other event" }, "2026-09-28T09:50:00.000Z", { eventId: "evt_other_0001" }),
  ];

  it("folds notes, status, marks, and feedback", () => {
    const folded = foldEventAnnotations(EVENT_ID, rows);
    expect(folded.notes.map((note) => note.text)).toEqual(["first"]);
    expect(folded.reviewStatus.status).toBe("reviewed");
    expect(folded.reviewStatus.updatedAt).toBe("2026-09-28T09:00:00.000Z");
    expect(folded.outcomeMark?.mark).toBe("false_negative");
    expect(folded.outcomeMark?.reason).toBe("missed");
    expect(folded.feedback).toHaveLength(1);
    expect(folded.feedback[0]!.suggestedIntentLabel).toBe("bill_payment");
  });

  it("defaults to unreviewed with no mark", () => {
    const folded = foldEventAnnotations(EVENT_ID, []);
    expect(folded.reviewStatus).toEqual({ status: "unreviewed", updatedAt: null, actor: null });
    expect(folded.outcomeMark).toBeNull();
  });

  it("folds review states for every requested id", () => {
    const states = foldReviewStates([EVENT_ID, "evt_other_0001", "evt_none_00001"], rows);
    expect(states.get(EVENT_ID)).toMatchObject({
      reviewStatus: "reviewed",
      outcomeMark: "false_negative",
      noteCount: 1,
      feedbackCount: 1,
      lastActivityAt: "2026-09-28T09:40:00.000Z",
    });
    expect(states.get("evt_other_0001")?.noteCount).toBe(1);
    expect(states.get("evt_none_00001")).toEqual({
      eventId: "evt_none_00001",
      reviewStatus: "unreviewed",
      outcomeMark: null,
      noteCount: 0,
      feedbackCount: 0,
      lastActivityAt: null,
    });
  });

  it("getReviewStates queries only analyst annotation rows", async () => {
    const findMany = vi.spyOn(prisma.auditLog, "findMany").mockResolvedValue(rows as never);
    const states = await getReviewStates([EVENT_ID, EVENT_ID]);
    expect(states.size).toBe(1);
    const where = findMany.mock.calls[0]![0]!.where as Record<string, { in: string[] }>;
    expect(where.eventId!.in).toEqual([EVENT_ID]);
    expect(where.actionType!.in.every((type) => type.startsWith("elah_analyst_"))).toBe(true);
    expect(await getReviewStates([])).toEqual(new Map());
  });
});

describe("saved views fold", () => {
  it("applies latest-wins and tombstones per reviewer", () => {
    const viewRow = (actionType: string, payload: Record<string, unknown>, at: string, actorId = actor.id) =>
      row(actionType, payload, at, { eventId: null, actorId });
    const views = foldSavedViews(actor.id, [
      viewRow(T.VIEW_SAVED, { viewId: "low", name: "Low", query: "band=review" }, "2026-09-28T08:00:00.000Z"),
      viewRow(T.VIEW_SAVED, { viewId: "agent", name: "Agent", query: "channel=agent&junk=1" }, "2026-09-28T08:10:00.000Z"),
      viewRow(T.VIEW_SAVED, { viewId: "low", name: "Low v2", query: "band=review&source=agent" }, "2026-09-28T08:20:00.000Z"),
      viewRow(T.VIEW_DELETED, { viewId: "agent" }, "2026-09-28T08:30:00.000Z"),
      viewRow(T.VIEW_SAVED, { viewId: "theirs", name: "Theirs", query: "" }, "2026-09-28T08:40:00.000Z", "user_other"),
    ]);
    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({
      viewId: "low",
      name: "Low v2",
      filters: { band: "review", source: "agent" },
      query: "source=agent&band=review",
      createdAt: "2026-09-28T08:00:00.000Z",
      updatedAt: "2026-09-28T08:20:00.000Z",
    });
  });
});
