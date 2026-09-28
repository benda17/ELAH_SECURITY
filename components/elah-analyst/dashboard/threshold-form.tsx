"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { setThresholdsAction, type AnalystActionState } from "@/app/actions/elah-analyst";
import {
  DEFAULT_DISPLAY_THRESHOLDS,
  validateThresholds,
  type ElahDisplayThresholds,
} from "@/lib/elah/analyst/bands";
import { ThresholdScale } from "./threshold-scale";
import { bandCounts, formatScore, formatUtcDateTime } from "./helpers";

export interface ThresholdMeta {
  isDefault: boolean;
  updatedAt: string | null;
  updatedByName: string | null;
}

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={disabled || pending} aria-disabled={disabled || pending}>
      {pending ? "Saving…" : "Save display thresholds"}
    </Button>
  );
}

function ThresholdCopy() {
  return (
    <div className="rounded-lg border border-line bg-bg-subtle/40 p-3 text-xs leading-relaxed text-ink-muted">
      <p>
        Thresholds are an <strong className="text-ink">org-wide display and triage preference</strong>. They only
        change how this portal groups, highlights, and links events into Review, Watch, and Clear.
      </p>
      <p className="mt-1.5">
        They <strong className="text-ink">never change the ELAH score</strong>, are never sent to the scorer, and have
        no effect on bank policy, which alone decides allow, deny, or confirm.
      </p>
    </div>
  );
}

/**
 * Display-threshold editor with a live preview of how the current window's
 * scored events would be grouped. Read-only when `canConfigure` is false.
 */
export function ThresholdForm({
  thresholds,
  meta,
  scores,
  canConfigure,
}: {
  thresholds: ElahDisplayThresholds;
  meta: ThresholdMeta;
  scores: number[];
  canConfigure: boolean;
}) {
  const [state, formAction] = useFormState<AnalystActionState | undefined, FormData>(
    setThresholdsAction,
    undefined,
  );
  const [reviewRaw, setReviewRaw] = useState(String(thresholds.reviewBelow));
  const [watchRaw, setWatchRaw] = useState(String(thresholds.watchBelow));
  useEffect(() => {
    setReviewRaw(String(thresholds.reviewBelow));
    setWatchRaw(String(thresholds.watchBelow));
  }, [thresholds.reviewBelow, thresholds.watchBelow]);
  const reviewId = useId();
  const watchId = useId();
  const hintId = useId();
  const errorId = useId();

  const draft = useMemo(
    () => validateThresholds({ reviewBelow: reviewRaw, watchBelow: watchRaw }),
    [reviewRaw, watchRaw],
  );
  const preview = draft.ok ? draft.value : thresholds;
  const counts = useMemo(() => bandCounts(scores, preview), [scores, preview]);
  const unchanged =
    draft.ok &&
    draft.value.reviewBelow === thresholds.reviewBelow &&
    draft.value.watchBelow === thresholds.watchBelow;

  const provenance = meta.isDefault
    ? `Using defaults (review < ${DEFAULT_DISPLAY_THRESHOLDS.reviewBelow}, watch < ${DEFAULT_DISPLAY_THRESHOLDS.watchBelow}).`
    : `Last changed${meta.updatedByName ? ` by ${meta.updatedByName}` : ""}${meta.updatedAt ? ` at ${formatUtcDateTime(meta.updatedAt)}` : ""}.`;

  return (
    <Card>
      <CardHeader
        title={
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="size-4 text-accent-gold" aria-hidden />
            Display thresholds
          </span>
        }
        description={provenance}
        action={
          canConfigure ? null : (
            <Badge variant="default" className="text-[10px]">
              View only
            </Badge>
          )
        }
      />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <ThresholdCopy />
          {canConfigure ? (
            <form action={formAction} className="space-y-4" aria-describedby={hintId} noValidate>
              <p id={hintId} className="text-xs text-ink-subtle">
                Scores below “Review below” are grouped as Review; scores below “Watch below” as Watch; everything else
                as Clear. Both values are between 0 and 1, and Review below must not exceed Watch below.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor={reviewId} hint={`current ${formatScore(thresholds.reviewBelow)}`}>
                    Review below
                  </Label>
                  <Input
                    id={reviewId}
                    name="reviewBelow"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={1}
                    step={0.01}
                    required
                    value={reviewRaw}
                    onChange={(e) => setReviewRaw(e.target.value)}
                    aria-invalid={!draft.ok}
                    aria-describedby={!draft.ok ? errorId : undefined}
                  />
                </div>
                <div>
                  <Label htmlFor={watchId} hint={`current ${formatScore(thresholds.watchBelow)}`}>
                    Watch below
                  </Label>
                  <Input
                    id={watchId}
                    name="watchBelow"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    max={1}
                    step={0.01}
                    required
                    value={watchRaw}
                    onChange={(e) => setWatchRaw(e.target.value)}
                    aria-invalid={!draft.ok}
                    aria-describedby={!draft.ok ? errorId : undefined}
                  />
                </div>
              </div>
              {!draft.ok ? (
                <p id={errorId} className="text-xs text-accent-rose">
                  {draft.error}
                </p>
              ) : null}
              <div className="flex flex-wrap items-center gap-2">
                <SaveButton disabled={!draft.ok || unchanged} />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReviewRaw(String(DEFAULT_DISPLAY_THRESHOLDS.reviewBelow));
                    setWatchRaw(String(DEFAULT_DISPLAY_THRESHOLDS.watchBelow));
                  }}
                >
                  Use defaults
                </Button>
                {!unchanged ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReviewRaw(String(thresholds.reviewBelow));
                      setWatchRaw(String(thresholds.watchBelow));
                    }}
                  >
                    Discard changes
                  </Button>
                ) : null}
              </div>
              <p role="status" aria-live="polite" className="min-h-[1rem] text-xs">
                {state?.error ? (
                  <span className="text-accent-rose">Not saved: {state.error}</span>
                ) : state?.ok ? (
                  <span className="text-accent-emerald">{state.message}</span>
                ) : null}
              </p>
            </form>
          ) : (
            <p className="text-xs text-ink-subtle">
              Only security reviewers can change display thresholds. Current values: review &lt;{" "}
              {formatScore(thresholds.reviewBelow)}, watch &lt; {formatScore(thresholds.watchBelow)}.
            </p>
          )}
        </div>
        <ThresholdScale
          thresholds={preview}
          counts={counts}
          total={scores.length}
          title={
            canConfigure && !unchanged && draft.ok
              ? "Preview — how this window's scored events would be grouped"
              : "How this window's scored events are grouped"
          }
        />
      </div>
    </Card>
  );
}
