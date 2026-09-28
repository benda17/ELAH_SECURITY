"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2, Lock } from "lucide-react";
import {
  addAnalystNoteAction,
  markOutcomeAction,
  setReviewStatusAction,
  submitFeedbackAction,
  type AnalystActionState,
} from "@/app/actions/elah-analyst";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/input";
import { OutcomeMarkBadge, ReviewStatusBadge } from "@/components/elah-analyst/shared";
import {
  ANALYST_TEXT_MAX,
  OUTCOME_MARKS,
  REVIEW_STATUSES,
  type AnalystActorRef,
  type OutcomeMark,
} from "@/lib/elah/analyst/constants";
import type { EventAnnotations } from "@/lib/elah/analyst/annotations";
import { ELAH_BANKING_INTENTS } from "@/lib/elah/types";
import { formatDate } from "@/lib/utils";

type Action = (prev: AnalystActionState | undefined, formData: FormData) => Promise<AnalystActionState>;

const INITIAL: AnalystActionState = {};

const REVIEW_LABEL: Record<(typeof REVIEW_STATUSES)[number], string> = {
  unreviewed: "Unreviewed",
  in_review: "In review",
  reviewed: "Reviewed",
  escalated: "Escalated",
};

const MARK_COPY: Record<OutcomeMark, { label: string; hint: string }> = {
  confirmed_correct: {
    label: "Confirmed correct",
    hint: "The ELAH intention reading matches your judgement.",
  },
  false_positive: {
    label: "False positive",
    hint: "The score read genuine intent as off-intent (too low / flagged for attention).",
  },
  false_negative: {
    label: "False negative",
    hint: "The score read non-genuine intent as genuine (too high / not flagged).",
  },
};

function actorText(actor: AnalystActorRef | null): string {
  if (!actor) return "unknown";
  const who = actor.name ?? actor.id ?? "unknown";
  return actor.role ? `${who} (${actor.role})` : who;
}

function Time({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning className="text-xs text-ink-subtle">
      {formatDate(iso)}
    </time>
  );
}

function SubmitButton({ children, pendingText }: { children: React.ReactNode; pendingText: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending} aria-disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          {pendingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}

function ActionFeedback({ state }: { state: AnalystActionState | undefined }) {
  return (
    <div role="status" aria-live="polite" className="min-h-[1.25rem] text-xs">
      {state?.error ? (
        <span className="inline-flex items-center gap-1.5 text-accent-rose">
          <AlertTriangle className="size-3.5" aria-hidden />
          {state.error}
        </span>
      ) : state?.ok ? (
        <span className="inline-flex items-center gap-1.5 text-accent-emerald">
          <CheckCircle2 className="size-3.5" aria-hidden />
          {state.message ?? "Saved."}
        </span>
      ) : null}
    </div>
  );
}

/** `useFormState` + reset the form after each successful submit. */
function useAnalystForm(action: Action) {
  const [state, formAction] = useFormState(action, INITIAL);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);
  return { state, formAction, formRef };
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id: string }) {
  return (
    <section aria-labelledby={id} className="space-y-3 border-t border-line pt-5 first:border-t-0 first:pt-0">
      <h4 id={id} className="text-sm font-semibold text-ink">
        {title}
      </h4>
      {children}
    </section>
  );
}

function ReviewStatusForm({ eventId, current }: { eventId: string; current: EventAnnotations["reviewStatus"] }) {
  const { state, formAction, formRef } = useAnalystForm(setReviewStatusAction);
  const selectId = useId();
  return (
    <form ref={formRef} action={formAction} className="space-y-2" key={`${current.status}-${current.updatedAt}`}>
      <input type="hidden" name="eventId" value={eventId} />
      <Field label="Review status" htmlFor={selectId}>
        <Select id={selectId} name="status" defaultValue={current.status} required>
          {REVIEW_STATUSES.map((status) => (
            <option key={status} value={status}>
              {REVIEW_LABEL[status]}
            </option>
          ))}
        </Select>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Saving…">Update status</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}

function OutcomeMarkForm({ eventId, current }: { eventId: string; current: EventAnnotations["outcomeMark"] }) {
  const { state, formAction, formRef } = useAnalystForm(markOutcomeAction);
  const reasonId = useId();
  const currentMark = current?.mark ?? "";
  return (
    <form ref={formRef} action={formAction} className="space-y-3" key={`${currentMark}-${current?.updatedAt ?? ""}`}>
      <input type="hidden" name="eventId" value={eventId} />
      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-muted">Mark the ELAH score</legend>
        {OUTCOME_MARKS.map((mark) => (
          <label
            key={mark}
            className="flex cursor-pointer items-start gap-2 rounded-lg border border-line px-3 py-2 text-sm has-[:checked]:border-accent-cyan/60 has-[:checked]:bg-accent-cyan/5"
          >
            <input type="radio" name="mark" value={mark} defaultChecked={currentMark === mark} className="mt-1" />
            <span>
              <span className="text-ink">{MARK_COPY[mark].label}</span>
              <span className="block text-xs text-ink-muted">{MARK_COPY[mark].hint}</span>
            </span>
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-2 px-3 text-sm text-ink-muted">
          <input type="radio" name="mark" value="" defaultChecked={currentMark === ""} />
          {current?.mark ? "Clear the current mark" : "No mark"}
        </label>
      </fieldset>
      <Field label="Reason (optional)" htmlFor={reasonId} hint={`max ${ANALYST_TEXT_MAX}`}>
        <Textarea
          id={reasonId}
          name="reason"
          maxLength={ANALYST_TEXT_MAX}
          className="min-h-[64px]"
          placeholder="Why is the score right or wrong? Emails and long numbers are redacted."
        />
      </Field>
      <p className="text-xs text-ink-subtle">Marks judge the ELAH score only, not the bank policy decision.</p>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Saving…">Save mark</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}

function NoteForm({ eventId }: { eventId: string }) {
  const { state, formAction, formRef } = useAnalystForm(addAnalystNoteAction);
  const [length, setLength] = useState(0);
  const textId = useId();
  useEffect(() => {
    if (state?.ok) setLength(0);
  }, [state]);
  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <input type="hidden" name="eventId" value={eventId} />
      <Field label="Add a note" htmlFor={textId} hint={`${length}/${ANALYST_TEXT_MAX}`}>
        <Textarea
          id={textId}
          name="text"
          required
          maxLength={ANALYST_TEXT_MAX}
          onChange={(e) => setLength(e.currentTarget.value.length)}
          className="min-h-[72px]"
          placeholder="Internal analyst note. Emails and long numbers are redacted."
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Adding…">Add note</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}

function FeedbackForm({ eventId }: { eventId: string }) {
  const { state, formAction, formRef } = useAnalystForm(submitFeedbackAction);
  const textId = useId();
  const labelId = useId();
  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="eventId" value={eventId} />
      <fieldset>
        <legend className="mb-1.5 text-xs font-medium uppercase tracking-wider text-ink-muted">
          Rating of the ELAH reading (1 = poor, 5 = excellent)
        </legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <label
              key={rating}
              className="flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line text-sm text-ink has-[:checked]:border-accent-gold has-[:checked]:bg-accent-gold/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent-cyan/60"
            >
              <input type="radio" name="rating" value={rating} required className="sr-only" aria-label={`${rating} of 5`} />
              <span aria-hidden>{rating}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <Field label="Suggested intent (optional)" htmlFor={labelId} hint="closed 22-label taxonomy">
        <Select id={labelId} name="suggestedIntentLabel" defaultValue="">
          <option value="">No suggestion</option>
          {ELAH_BANKING_INTENTS.map((intent) => (
            <option key={intent} value={intent}>
              {intent}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Feedback (optional)" htmlFor={textId} hint={`max ${ANALYST_TEXT_MAX}`}>
        <Textarea
          id={textId}
          name="text"
          maxLength={ANALYST_TEXT_MAX}
          className="min-h-[64px]"
          placeholder="What should the scorer have seen? Emails and long numbers are redacted."
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pendingText="Submitting…">Submit feedback</SubmitButton>
        <ActionFeedback state={state} />
      </div>
    </form>
  );
}

function ReadOnlyNotice() {
  return (
    <p className="flex items-center gap-2 rounded-lg border border-line bg-bg-panel/40 px-3 py-2 text-xs text-ink-muted">
      <Lock className="size-3.5 shrink-0" aria-hidden />
      Your role can view this review but cannot annotate it.
    </p>
  );
}

export function ReviewPanel({
  eventId,
  annotations,
  canAnnotate,
}: {
  eventId: string;
  /** null when annotations failed to load. */
  annotations: EventAnnotations | null;
  canAnnotate: boolean;
}) {
  const baseId = useId();
  if (!annotations) {
    return (
      <Card>
        <CardHeader title="Analyst review" />
        <p role="alert" className="flex items-center gap-2 text-sm text-accent-rose">
          <AlertTriangle className="size-4 shrink-0" aria-hidden />
          Could not load review data. Reload the page to retry.
        </p>
      </Card>
    );
  }
  const { reviewStatus, outcomeMark, notes, feedback } = annotations;

  return (
    <Card>
      <CardHeader
        title="Analyst review"
        description="Review the ELAH score. Bank policy decisions are not changed here."
      />
      <div className="space-y-5">
        {!canAnnotate ? <ReadOnlyNotice /> : null}

        <Section title="Review status" id={`${baseId}-status`}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            <ReviewStatusBadge status={reviewStatus.status} />
            {reviewStatus.updatedAt ? (
              <>
                <span>by {actorText(reviewStatus.actor)}</span>
                <Time iso={reviewStatus.updatedAt} />
              </>
            ) : (
              <span>Never reviewed</span>
            )}
          </div>
          {canAnnotate ? <ReviewStatusForm eventId={eventId} current={reviewStatus} /> : null}
        </Section>

        <Section title="Score outcome (false positive / false negative)" id={`${baseId}-mark`}>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
            {outcomeMark?.mark ? (
              <>
                <OutcomeMarkBadge mark={outcomeMark.mark} />
                <span>by {actorText(outcomeMark.actor)}</span>
                <Time iso={outcomeMark.updatedAt} />
              </>
            ) : (
              <span>{outcomeMark ? "Mark cleared" : "Not marked"}</span>
            )}
          </div>
          {outcomeMark?.reason ? (
            <p className="whitespace-pre-wrap rounded-lg border border-line bg-bg-panel/40 px-3 py-2 text-sm text-ink">
              {outcomeMark.reason}
            </p>
          ) : null}
          {canAnnotate ? <OutcomeMarkForm eventId={eventId} current={outcomeMark} /> : null}
        </Section>

        <Section title={`Notes (${notes.length})`} id={`${baseId}-notes`}>
          {notes.length === 0 ? (
            <p className="text-sm text-ink-muted">No notes yet.</p>
          ) : (
            <ol className="space-y-2">
              {[...notes].reverse().map((note) => (
                <li key={note.id} className="rounded-lg border border-line bg-bg-panel/40 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span>{actorText(note.actor)}</span>
                    <Time iso={note.createdAt} />
                  </div>
                  <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{note.text}</p>
                </li>
              ))}
            </ol>
          )}
          {canAnnotate ? <NoteForm eventId={eventId} /> : null}
        </Section>

        <Section title={`Feedback (${feedback.length})`} id={`${baseId}-feedback`}>
          {feedback.length === 0 ? (
            <p className="text-sm text-ink-muted">No feedback yet.</p>
          ) : (
            <ol className="space-y-2">
              {[...feedback].reverse().map((item) => (
                <li key={item.id} className="rounded-lg border border-line bg-bg-panel/40 px-3 py-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <span className="font-mono text-ink" aria-label={`Rating ${item.rating} of 5`}>
                      {item.rating}/5
                    </span>
                    {item.suggestedIntentLabel ? (
                      <span>
                        suggested <span className="font-mono text-ink">{item.suggestedIntentLabel}</span>
                      </span>
                    ) : null}
                    <span>{actorText(item.actor)}</span>
                    <Time iso={item.createdAt} />
                  </div>
                  {item.text ? (
                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-ink">{item.text}</p>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
          {canAnnotate ? <FeedbackForm eventId={eventId} /> : null}
        </Section>
      </div>
    </Card>
  );
}
