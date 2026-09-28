import { describe, expect, it } from "vitest";
import {
  ANALYST_EXPORT_COLUMNS,
  csvCell,
  toCsv,
  toExportRecord,
  toJson,
} from "@/lib/elah/analyst/export";
import { makeRow, scored } from "./analyst-helpers";

describe("csvCell", () => {
  it("quotes commas, quotes, and newlines", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("line1\nline2")).toBe('"line1\nline2"');
    expect(csvCell("line1\r\nline2")).toBe('"line1\r\nline2"');
    expect(csvCell(" padded ")).toBe('" padded "');
    expect(csvCell("plain")).toBe("plain");
  });

  it("neutralizes spreadsheet formula injection", () => {
    expect(csvCell("=HYPERLINK(\"http://x\")")).toBe("\"'=HYPERLINK(\"\"http://x\"\")\"");
    expect(csvCell("+1+1")).toBe("'+1+1");
    expect(csvCell("-2+3")).toBe("'-2+3");
    expect(csvCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(csvCell("\tcmd")).toBe("'\tcmd");
    expect(csvCell("=1,2")).toBe("\"'=1,2\"");
  });

  it("emits numbers raw and nulls empty", () => {
    expect(csvCell(0.87)).toBe("0.87");
    expect(csvCell(null)).toBe("");
    expect(csvCell(undefined)).toBe("");
    expect(csvCell(Number.NaN)).toBe("");
  });
});

describe("toCsv / toJson", () => {
  const row = makeRow({
    event: { eventId: "evt_export_0001", actor: { userIdHash: "=cmd|' /C calc'!A0", sessionId: "s,1", actorType: "customer" } },
    score: scored(0.3),
    review: { reviewStatus: "escalated", outcomeMark: "false_negative" },
  });

  it("writes a header and one CRLF-terminated line per row", () => {
    const csv = toCsv([row]);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe(ANALYST_EXPORT_COLUMNS.join(","));
    expect(lines).toHaveLength(3);
    expect(lines[2]).toBe("");
    expect(lines[1]).toContain("evt_export_0001");
    expect(lines[1]).toContain("'=cmd|' /C calc'!A0");
    expect(lines[1]).toContain('"s,1"');
    expect(lines[1]).toContain(",0.3,");
    expect(lines[1]).toContain(",review,escalated,false_negative");
  });

  it("never exports utterances or args", () => {
    const csv = toCsv([row]);
    const json = toJson([row]);
    expect(csv).not.toContain("Daniel");
    expect(json).not.toContain("Daniel");
    expect(Object.keys(toExportRecord(row))).toEqual([...ANALYST_EXPORT_COLUMNS]);
  });

  it("serializes flattened JSON records", () => {
    const parsed = JSON.parse(toJson([row])) as Array<Record<string, unknown>>;
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      eventId: "evt_export_0001",
      elahScore: 0.3,
      band: "review",
      reviewStatus: "escalated",
      outcomeMark: "false_negative",
      modelVersion: "rules_v0",
    });
  });

  it("handles an empty export", () => {
    expect(toCsv([])).toBe(`${ANALYST_EXPORT_COLUMNS.join(",")}\r\n`);
    expect(toJson([])).toBe("[]");
  });
});
