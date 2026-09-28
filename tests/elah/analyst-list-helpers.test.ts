import { describe, expect, it } from "vitest";
import { parseAnalystFilters, type AnalystEventFilters } from "@/lib/elah/analyst/filters";
import {
  ariaSortFor,
  buildActiveFilterChips,
  buildExportHref,
  buildListHref,
  datetimeLocalToIso,
  filterFormToQuery,
  formatUtcShort,
  hasAdvancedFilters,
  hasAnyFilter,
  isUncalibratedModel,
  nextSortFor,
  parseListSort,
  sortAnalystRows,
  toDatetimeLocalValue,
  truncateText,
  truncationNotice,
} from "@/components/elah-analyst/list/list-helpers";
import { makeEvent, makeRow, scored } from "./analyst-helpers";

const HASH = "a1b2c3d4e5f60718293a4b5c6d7e8f90";

describe("buildActiveFilterChips", () => {
  it("returns no chips for empty filters or the default limit", () => {
    expect(buildActiveFilterChips({})).toEqual([]);
    expect(buildActiveFilterChips({ limit: 100 })).toEqual([]);
    expect(hasAnyFilter({ limit: 100 })).toBe(false);
  });

  it("emits one chip per filter in canonical order with remove links that keep the rest", () => {
    const filters: AnalystEventFilters = {
      q: "daniel",
      source: "agent",
      toolName: "pay_bill",
      scoreMax: 0.4,
    };
    const chips = buildActiveFilterChips(filters);
    expect(chips.map((chip) => chip.key)).toEqual(["q", "source", "toolName", "scoreMax"]);
    expect(chips[0]).toMatchObject({ label: "Search", value: "daniel" });
    expect(chips[3]).toMatchObject({ label: "Score ≤", value: "0.40" });

    const removeSource = new URL(chips[1].removeHref, "http://x");
    expect(removeSource.pathname).toBe("/admin/elah-events");
    expect(parseAnalystFilters(removeSource.searchParams)).toEqual({
      q: "daniel",
      toolName: "pay_bill",
      scoreMax: 0.4,
    });
  });

  it("labels users by demo-customer name, dates in UTC, marks readably, and keeps sort", () => {
    const chips = buildActiveFilterChips(
      {
        from: "2026-09-27T05:30:00.000Z",
        userIdHash: HASH,
        outcomeMark: "fp_or_fn",
        limit: 250,
      },
      { sort: "score_asc", userLabels: new Map([[HASH, "Dana · Premium"]]) },
    );
    expect(chips.map((chip) => chip.value)).toEqual([
      "2026-09-27 05:30 UTC",
      "Dana · Premium",
      "any FP / FN",
      "250",
    ]);
    expect(chips[0].removeHref).toContain("sort=score_asc");
    expect(chips[0].removeHref).not.toContain("from=");
  });

  it("falls back to a shortened hash for unknown users", () => {
    const [chip] = buildActiveFilterChips({ userIdHash: HASH });
    expect(chip.value).toBe("a1b2c3d4…");
  });
});

describe("hrefs", () => {
  it("builds list hrefs, omitting the default sort", () => {
    expect(buildListHref({})).toBe("/admin/elah-events");
    expect(buildListHref({}, "newest")).toBe("/admin/elah-events");
    expect(buildListHref({ source: "ui" }, "oldest")).toBe("/admin/elah-events?source=ui&sort=oldest");
  });

  it("builds export hrefs with the canonical filters and format", () => {
    expect(buildExportHref({}, "json")).toBe("/api/admin/elah/analyst/export?format=json");
    const url = new URL(buildExportHref({ band: "review", preset: "7d" }, "csv"), "http://x");
    expect(url.pathname).toBe("/api/admin/elah/analyst/export");
    expect(url.searchParams.get("format")).toBe("csv");
    expect(parseAnalystFilters(url.searchParams)).toEqual({ band: "review", preset: "7d" });
  });
});

describe("sorting", () => {
  const a = makeRow({ event: makeEvent({ eventId: "a", occurredAt: "2026-09-28T07:00:00.000Z" }), score: scored(0.9, { confidence: 0.3 }) });
  const b = makeRow({ event: makeEvent({ eventId: "b", occurredAt: "2026-09-28T09:00:00.000Z" }), score: scored(0.2, { confidence: 0.9 }) });
  const c = makeRow({ event: makeEvent({ eventId: "c", occurredAt: "2026-09-28T08:00:00.000Z" }), score: null });
  const ids = (rows: { event: { eventId: string } }[]) => rows.map((row) => row.event.eventId);

  it("parses sort params tolerantly", () => {
    expect(parseListSort(undefined)).toBe("newest");
    expect(parseListSort("junk")).toBe("newest");
    expect(parseListSort(["score_asc", "oldest"])).toBe("score_asc");
  });

  it("sorts by time and puts unscored rows last for score / confidence", () => {
    expect(ids(sortAnalystRows([a, b, c], "newest"))).toEqual(["b", "c", "a"]);
    expect(ids(sortAnalystRows([a, b, c], "oldest"))).toEqual(["a", "c", "b"]);
    expect(ids(sortAnalystRows([a, b, c], "score_asc"))).toEqual(["b", "a", "c"]);
    expect(ids(sortAnalystRows([a, b, c], "score_desc"))).toEqual(["a", "b", "c"]);
    expect(ids(sortAnalystRows([a, b, c], "confidence_asc"))).toEqual(["a", "b", "c"]);
    expect(ids(sortAnalystRows([c, a, b], "confidence_desc"))).toEqual(["b", "a", "c"]);
  });

  it("does not mutate the input", () => {
    const input = [a, b, c];
    sortAnalystRows(input, "score_asc");
    expect(ids(input)).toEqual(["a", "b", "c"]);
  });

  it("derives aria-sort and header toggles", () => {
    expect(ariaSortFor("time", "newest")).toBe("descending");
    expect(ariaSortFor("time", "oldest")).toBe("ascending");
    expect(ariaSortFor("score", "score_asc")).toBe("ascending");
    expect(ariaSortFor("score", "newest")).toBe("none");
    expect(nextSortFor("time", "newest")).toBe("oldest");
    expect(nextSortFor("time", "oldest")).toBe("newest");
    expect(nextSortFor("score", "newest")).toBe("score_asc");
    expect(nextSortFor("score", "score_asc")).toBe("score_desc");
  });
});

describe("dates", () => {
  it("round-trips datetime-local values through ISO in the runtime time zone", () => {
    const local = new Date(2026, 8, 28, 10, 45);
    const value = toDatetimeLocalValue(local);
    expect(value).toBe("2026-09-28T10:45");
    expect(datetimeLocalToIso(value)).toBe(local.toISOString());
    expect(datetimeLocalToIso("")).toBeNull();
    expect(datetimeLocalToIso("not a date")).toBeNull();
    expect(toDatetimeLocalValue(new Date("nope"))).toBe("");
  });

  it("formats UTC chips", () => {
    expect(formatUtcShort("2026-09-28T07:05:09.000Z")).toBe("2026-09-28 07:05 UTC");
    expect(formatUtcShort("garbage")).toBe("garbage");
  });
});

describe("filterFormToQuery", () => {
  it("drops blanks / all / default sort and converts local dates to ISO", () => {
    const from = new Date(2026, 8, 27, 8, 0);
    const query = filterFormToQuery([
      ["q", "  transfer "],
      ["source", "all"],
      ["toolName", ""],
      ["from", toDatetimeLocalValue(from)],
      ["to", ""],
      ["sort", "newest"],
      ["band", "review"],
      ["limit", "100"],
    ]);
    expect(new URLSearchParams(filterFormToQuery([["limit", "250"]])).get("limit")).toBe("250");
    const params = new URLSearchParams(query);
    expect(params.get("q")).toBe("transfer");
    expect(params.has("source")).toBe(false);
    expect(params.has("toolName")).toBe(false);
    expect(params.get("from")).toBe(from.toISOString());
    expect(params.has("to")).toBe(false);
    expect(params.has("sort")).toBe(false);
    expect(params.get("band")).toBe("review");
    expect(params.has("limit")).toBe(false);
  });
});

describe("misc", () => {
  it("detects advanced filters", () => {
    expect(hasAdvancedFilters({ q: "x", preset: "24h", from: "2026-09-27T00:00:00.000Z" })).toBe(false);
    expect(hasAdvancedFilters({ limit: 100 })).toBe(false);
    expect(hasAdvancedFilters({ limit: 250 })).toBe(true);
    expect(hasAdvancedFilters({ sessionId: "s1" })).toBe(true);
  });

  it("truncates and collapses whitespace", () => {
    expect(truncateText("  hello \n  world ", 50)).toBe("hello world");
    expect(truncateText("abcdefghij", 5)).toBe("abcd…");
  });

  it("flags rules_v0 as uncalibrated", () => {
    expect(isUncalibratedModel("rules_v0")).toBe(true);
    expect(isUncalibratedModel(null, "rules_v0")).toBe(true);
    expect(isUncalibratedModel("elah-v1.2")).toBe(false);
    expect(isUncalibratedModel(null, null)).toBe(false);
  });

  it("explains truncation without inventing counts", () => {
    expect(truncationNotice({ truncated: false, scanned: 40, limit: 100, rowCount: 40 })).toBeNull();
    expect(truncationNotice({ truncated: true, scanned: 1000, limit: 100, rowCount: 12 })).toMatch(
      /Narrow the date range/,
    );
    expect(truncationNotice({ truncated: true, scanned: 100, limit: 100, rowCount: 100 })).toMatch(
      /newest 100/,
    );
    expect(truncationNotice({ truncated: false, scanned: 600, limit: 100, rowCount: 100 })).toMatch(
      /Raise the row limit/,
    );
  });
});
