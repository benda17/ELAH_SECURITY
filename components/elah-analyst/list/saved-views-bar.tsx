"use client";

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Bookmark, BookmarkPlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ANALYST_VIEW_NAME_MAX } from "@/lib/elah/analyst/constants";
import {
  deleteViewAction,
  saveViewAction,
  type AnalystActionState,
} from "@/app/actions/elah-analyst";
import { hrefForSavedView } from "./list-helpers";

export interface SavedViewLink {
  viewId: string;
  name: string;
  query: string;
}

function ActionMessage({ state }: { state: AnalystActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="text-xs text-accent-rose">
        {state.error}
      </p>
    );
  }
  return (
    <p role="status" aria-live="polite" className="text-xs text-accent-emerald">
      {state.ok ? state.message : ""}
    </p>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" size="sm" disabled={pending}>
      {pending ? <Loader2 aria-hidden className="size-3.5 animate-spin" /> : <BookmarkPlus aria-hidden className="size-3.5" />}
      {pending ? "Saving…" : "Save view"}
    </Button>
  );
}

function DeleteViewButton({ view }: { view: SavedViewLink }) {
  const [state, formAction] = useFormState<AnalystActionState, FormData>(deleteViewAction, {});
  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete saved view "${view.name}"?`)) event.preventDefault();
      }}
      className="contents"
    >
      <input type="hidden" name="viewId" value={view.viewId} />
      <DeleteSubmit name={view.name} />
      {state.error ? (
        <span role="alert" className="text-xs text-accent-rose">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}

function DeleteSubmit({ name }: { name: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={`Delete saved view ${name}`}
      title="Delete view"
      className="rounded-full p-1 text-ink-subtle hover:bg-accent-rose/15 hover:text-accent-rose disabled:opacity-50"
    >
      {pending ? <Loader2 aria-hidden className="size-3 animate-spin" /> : <X aria-hidden className="size-3" />}
    </button>
  );
}

/**
 * Personal saved filter views for the signed-in reviewer. Views store the
 * canonical filter query only (not sort); they affect no one else.
 */
export function SavedViewsBar({
  views,
  currentQuery,
}: {
  views: SavedViewLink[];
  currentQuery: string;
}) {
  const [state, formAction] = useFormState<AnalystActionState, FormData>(saveViewAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <section aria-labelledby={`${uid}-title`} className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={`${uid}-title`} className="inline-flex items-center gap-2 text-sm font-semibold text-ink">
          <Bookmark aria-hidden className="size-4 text-accent-gold" />
          Saved views
          <span className="text-xs font-normal text-ink-subtle">(personal)</span>
        </h3>
      </div>

      {views.length === 0 ? (
        <p className="text-sm text-ink-subtle">
          No saved views yet. Set filters, then save them under a name to reuse later.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label="Saved views">
          {views.map((view) => {
            const active = view.query === currentQuery;
            return (
              <li
                key={view.viewId}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border py-0.5 pl-3 pr-1 text-sm",
                  active
                    ? "border-accent-gold/60 bg-accent-gold/10 text-accent-gold"
                    : "border-line bg-bg-elevated text-ink",
                )}
              >
                <Link
                  href={hrefForSavedView(view.query)}
                  aria-current={active ? "page" : undefined}
                  className="max-w-[16rem] truncate hover:underline"
                  title={view.query ? `?${view.query}` : "No filters"}
                >
                  {view.name}
                </Link>
                <DeleteViewButton view={view} />
              </li>
            );
          })}
        </ul>
      )}

      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-2">
        <input type="hidden" name="query" value={currentQuery} />
        <div className="min-w-[12rem] flex-1 sm:max-w-xs">
          <label htmlFor={`${uid}-name`} className="sr-only">
            Name for the current filters
          </label>
          <Input
            id={`${uid}-name`}
            name="name"
            required
            maxLength={ANALYST_VIEW_NAME_MAX}
            placeholder="Name current filters…"
            className="h-8 py-1 text-xs"
            autoComplete="off"
          />
        </div>
        <SaveButton />
        <div className="basis-full">
          <ActionMessage state={state} />
        </div>
      </form>
      <p className="text-xs text-ink-subtle">Saving with an existing name overwrites that view.</p>
    </section>
  );
}
