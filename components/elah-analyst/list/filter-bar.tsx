"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { ChevronDown, Loader2, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ElahDisplayThresholds, ScoreBand } from "@/lib/elah/analyst/bands";
import {
  ANALYST_LIMIT_DEFAULT,
  ANALYST_LIMIT_MAX,
  type AnalystEventFilters,
} from "@/lib/elah/analyst/filters";
import {
  ELAH_EVENTS_PATH,
  LIST_SORT_DEFAULT,
  filterFormToQuery,
  hasAdvancedFilters,
  humanize,
  isUncalibratedModel,
  shortHash,
  toDatetimeLocalValue,
  type ListSort,
} from "./list-helpers";

/** Serializable subset of `AnalystFilterFacets` needed by the filter bar. */
export interface FilterBarFacets {
  sources: readonly string[];
  channels: readonly string[];
  actionTypes: readonly string[];
  toolNames: readonly string[];
  outcomes: readonly string[];
  qualities: readonly string[];
  intentLabels: readonly string[];
  observedIntentLabels: readonly string[];
  modelVersions: readonly string[];
  reviewStatuses: readonly string[];
  markFilters: readonly string[];
  bands: readonly string[];
  datePresets: readonly string[];
  users: readonly { userIdHash: string; name: string; roleLabel: string }[];
}

const PRESET_LABELS: Record<string, string> = {
  "1h": "Last hour",
  "24h": "Last 24 hours",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
};

const CHANNEL_LABELS: Record<string, string> = {
  agent: "Agent (AI assistant)",
  ui: "UI (non-agent)",
};

const MARK_LABELS: Record<string, string> = {
  confirmed_correct: "Confirmed correct",
  false_positive: "False positive",
  false_negative: "False negative",
  fp_or_fn: "Any FP / FN",
  unmarked: "Unmarked",
};

const LIMIT_OPTIONS = [50, ANALYST_LIMIT_DEFAULT, 250, 500, ANALYST_LIMIT_MAX];

function bandOptionLabel(band: string, t: ElahDisplayThresholds): string {
  switch (band as ScoreBand) {
    case "review":
      return `Review (score < ${t.reviewBelow.toFixed(2)})`;
    case "watch":
      return `Watch (${t.reviewBelow.toFixed(2)}–${t.watchBelow.toFixed(2)})`;
    case "clear":
      return `Clear (score ≥ ${t.watchBelow.toFixed(2)})`;
    default:
      return "Unscored";
  }
}

function withCurrent(options: readonly string[], current: string | undefined): string[] {
  return current && !options.includes(current) ? [...options, current] : [...options];
}

function AllSelect({
  id,
  name,
  value,
  allLabel,
  options,
  labelFor = humanize,
}: {
  id: string;
  name: keyof AnalystEventFilters;
  value: string | undefined;
  allLabel: string;
  options: readonly string[];
  labelFor?: (value: string) => string;
}) {
  return (
    <Select id={id} name={name} defaultValue={value ?? "all"}>
      <option value="all">{allLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {labelFor(option)}
        </option>
      ))}
    </Select>
  );
}

function Group({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0 space-y-3 rounded-lg border border-line/70 p-3">
      <legend className="px-1 text-[11px] font-semibold uppercase tracking-wider text-ink-subtle">
        {legend}
      </legend>
      {children}
    </fieldset>
  );
}

export function FilterBar({
  filters,
  facets,
  thresholds,
  sort,
}: {
  filters: AnalystEventFilters;
  facets: FilterBarFacets;
  thresholds: ElahDisplayThresholds;
  sort: ListSort;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showMore, setShowMore] = useState(() => hasAdvancedFilters(filters));
  const fromRef = useRef<HTMLInputElement>(null);
  const toRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const id = (name: string) => `${uid}-${name}`;
  const moreId = id("more");

  // datetime-local has no time zone; fill it in the browser's zone after mount
  // so server and client markup match.
  useEffect(() => {
    if (fromRef.current) fromRef.current.value = filters.from ? toDatetimeLocalValue(new Date(filters.from)) : "";
    if (toRef.current) toRef.current.value = filters.to ? toDatetimeLocalValue(new Date(filters.to)) : "";
  }, [filters.from, filters.to]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = filterFormToQuery(new FormData(event.currentTarget).entries());
    startTransition(() => {
      router.push(query ? `${ELAH_EVENTS_PATH}?${query}` : ELAH_EVENTS_PATH);
    });
  }

  const userOptions = [...facets.users];
  if (filters.userIdHash && !userOptions.some((u) => u.userIdHash === filters.userIdHash)) {
    userOptions.push({ userIdHash: filters.userIdHash, name: shortHash(filters.userIdHash), roleLabel: "other" });
  }
  const observed = new Set(facets.observedIntentLabels);
  const otherIntents = facets.intentLabels.filter((label) => !observed.has(label));
  const modelVersions = withCurrent(facets.modelVersions, filters.modelVersion);

  return (
    <form
      role="search"
      aria-label="Filter ELAH events"
      method="get"
      action={ELAH_EVENTS_PATH}
      onSubmit={onSubmit}
      aria-busy={isPending}
      className="space-y-4"
    >
      {sort !== LIST_SORT_DEFAULT ? <input type="hidden" name="sort" value={sort} /> : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <Field label="Search" htmlFor={id("q")}>
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" />
            <Input
              id={id("q")}
              name="q"
              type="search"
              defaultValue={filters.q ?? ""}
              maxLength={200}
              placeholder="eventId, userIdHash, customer text, tool"
              className="pl-9"
            />
          </div>
        </Field>
        <Field label="Date range" htmlFor={id("preset")}>
          <AllSelect
            id={id("preset")}
            name="preset"
            value={filters.preset}
            allLabel="Any time"
            options={facets.datePresets}
            labelFor={(value) => PRESET_LABELS[value] ?? value}
          />
        </Field>
        <Field label="From" htmlFor={id("from")} hint="your local time">
          <Input
            ref={fromRef}
            id={id("from")}
            name="from"
            type="datetime-local"
            aria-describedby={id("date-hint")}
          />
        </Field>
        <Field label="To" htmlFor={id("to")} hint="your local time">
          <Input ref={toRef} id={id("to")} name="to" type="datetime-local" aria-describedby={id("date-hint")} />
        </Field>
      </div>
      <p id={id("date-hint")} className="-mt-2 text-xs text-ink-subtle">
        A custom From date overrides the preset. Each page scans at most {ANALYST_LIMIT_MAX} events,
        so narrow the range to reach older ones.
      </p>

      <button
        type="button"
        className="inline-flex items-center gap-2 text-sm font-medium text-accent-cyan hover:underline md:hidden"
        aria-expanded={showMore}
        aria-controls={moreId}
        onClick={() => setShowMore((open) => !open)}
      >
        <SlidersHorizontal aria-hidden className="size-4" />
        {showMore ? "Fewer filters" : "More filters"}
        <ChevronDown aria-hidden className={cn("size-4 transition-transform", showMore && "rotate-180")} />
      </button>

      <div
        id={moreId}
        className={cn(showMore ? "grid" : "hidden", "gap-3 md:grid md:grid-cols-2 xl:grid-cols-3")}
      >
        <Group legend="User & session">
          <Field label="Demo customer" htmlFor={id("userIdHash")}>
            <Select id={id("userIdHash")} name="userIdHash" defaultValue={filters.userIdHash ?? "all"}>
              <option value="all">All users</option>
              {userOptions.map((user) => (
                <option key={user.userIdHash} value={user.userIdHash}>
                  {user.name} · {user.roleLabel}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Session ID" htmlFor={id("sessionId")}>
            <Input
              id={id("sessionId")}
              name="sessionId"
              defaultValue={filters.sessionId ?? ""}
              maxLength={128}
              pattern={"[A-Za-z0-9_.:\\-]{1,128}"}
              title="Letters, digits, and _ . : - only"
              placeholder="sessionId"
              autoComplete="off"
            />
          </Field>
        </Group>

        <Group legend="Banking action">
          <Field label="Action type" htmlFor={id("actionType")}>
            <AllSelect id={id("actionType")} name="actionType" value={filters.actionType} allLabel="All actions" options={facets.actionTypes} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Outcome" htmlFor={id("outcome")}>
              <AllSelect id={id("outcome")} name="outcome" value={filters.outcome} allLabel="All outcomes" options={facets.outcomes} />
            </Field>
            <Field label="Quality" htmlFor={id("quality")}>
              <AllSelect id={id("quality")} name="quality" value={filters.quality} allLabel="All quality" options={facets.qualities} />
            </Field>
          </div>
        </Group>

        <Group legend="Agent & tool">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Channel" htmlFor={id("channel")}>
              <AllSelect
                id={id("channel")}
                name="channel"
                value={filters.channel}
                allLabel="All channels"
                options={facets.channels}
                labelFor={(value) => CHANNEL_LABELS[value] ?? value}
              />
            </Field>
            <Field label="Source" htmlFor={id("source")}>
              <AllSelect id={id("source")} name="source" value={filters.source} allLabel="All sources" options={facets.sources} />
            </Field>
          </div>
          <Field label="Tool" htmlFor={id("toolName")}>
            <AllSelect
              id={id("toolName")}
              name="toolName"
              value={filters.toolName}
              allLabel="All tools"
              options={facets.toolNames}
              labelFor={(value) => value}
            />
          </Field>
        </Group>

        <Group legend="ELAH score & model">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Band" htmlFor={id("band")}>
              <AllSelect
                id={id("band")}
                name="band"
                value={filters.band}
                allLabel="All bands"
                options={facets.bands}
                labelFor={(value) => bandOptionLabel(value, thresholds)}
              />
            </Field>
            <Field label="Model version" htmlFor={id("modelVersion")}>
              <AllSelect
                id={id("modelVersion")}
                name="modelVersion"
                value={filters.modelVersion}
                allLabel="All models"
                options={modelVersions}
                labelFor={(value) => (isUncalibratedModel(value) ? `${value} (uncalibrated)` : value)}
              />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Score min" htmlFor={id("scoreMin")}>
              <Input id={id("scoreMin")} name="scoreMin" type="number" inputMode="decimal" min={0} max={1} step={0.01} defaultValue={filters.scoreMin ?? ""} placeholder="0" />
            </Field>
            <Field label="Score max" htmlFor={id("scoreMax")}>
              <Input id={id("scoreMax")} name="scoreMax" type="number" inputMode="decimal" min={0} max={1} step={0.01} defaultValue={filters.scoreMax ?? ""} placeholder="1" />
            </Field>
            <Field label="Conf. min" htmlFor={id("confidenceMin")}>
              <Input id={id("confidenceMin")} name="confidenceMin" type="number" inputMode="decimal" min={0} max={1} step={0.01} defaultValue={filters.confidenceMin ?? ""} placeholder="0" />
            </Field>
          </div>
          <Field label="Intent label" htmlFor={id("intentLabel")}>
            <Select id={id("intentLabel")} name="intentLabel" defaultValue={filters.intentLabel ?? "all"}>
              <option value="all">All intents</option>
              {facets.observedIntentLabels.length > 0 ? (
                <optgroup label="Seen in recent scores">
                  {facets.observedIntentLabels.map((label) => (
                    <option key={label} value={label}>
                      {humanize(label)}
                    </option>
                  ))}
                </optgroup>
              ) : null}
              <optgroup label={facets.observedIntentLabels.length > 0 ? "Other labels" : "All labels"}>
                {otherIntents.map((label) => (
                  <option key={label} value={label}>
                    {humanize(label)}
                  </option>
                ))}
              </optgroup>
            </Select>
          </Field>
        </Group>

        <Group legend="Review">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Review status" htmlFor={id("reviewStatus")}>
              <AllSelect id={id("reviewStatus")} name="reviewStatus" value={filters.reviewStatus} allLabel="Any status" options={facets.reviewStatuses} />
            </Field>
            <Field label="FP / FN mark" htmlFor={id("outcomeMark")}>
              <AllSelect
                id={id("outcomeMark")}
                name="outcomeMark"
                value={filters.outcomeMark}
                allLabel="Any mark"
                options={facets.markFilters}
                labelFor={(value) => MARK_LABELS[value] ?? humanize(value)}
              />
            </Field>
          </div>
        </Group>

        <Group legend="Results">
          <Field label="Row limit" htmlFor={id("limit")}>
            <Select id={id("limit")} name="limit" defaultValue={String(filters.limit ?? ANALYST_LIMIT_DEFAULT)}>
              {withCurrent(LIMIT_OPTIONS.map(String), filters.limit != null ? String(filters.limit) : undefined).map((value) => (
                <option key={value} value={value}>
                  {value} rows
                </option>
              ))}
            </Select>
          </Field>
        </Group>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="secondary" disabled={isPending}>
          {isPending ? <Loader2 aria-hidden className="size-4 animate-spin" /> : <Search aria-hidden className="size-4" />}
          {isPending ? "Applying…" : "Apply filters"}
        </Button>
        <Link
          href={ELAH_EVENTS_PATH}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-transparent px-4 text-sm font-medium text-ink-muted hover:bg-bg-elevated hover:text-ink"
        >
          <RotateCcw aria-hidden className="size-4" />
          Reset
        </Link>
        <span role="status" aria-live="polite" className="sr-only">
          {isPending ? "Loading filtered events" : ""}
        </span>
      </div>
    </form>
  );
}
