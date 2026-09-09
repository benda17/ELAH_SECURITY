"use client";

import { Mail, Send } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import {
  sendNewsletterAction,
  type NewsletterSendState,
} from "@/app/actions/newsletter";
import { renderNewsletterEmailHtml } from "@/lib/newsletter/template";

const initialState: NewsletterSendState = {};

function PublishButton({
  label,
  disabled,
}: {
  label: string;
  disabled: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-surface-base disabled:opacity-50"
    >
      <Send className="size-3.5" />
      {pending ? "Publishing…" : label}
    </button>
  );
}

export function NewsletterComposeForm({
  subscriberCount,
  resendReady,
  fromValue,
  publishLabel,
}: {
  subscriberCount: number;
  resendReady: boolean;
  fromValue: string;
  publishLabel?: string;
}) {
  const [state, formAction] = useFormState(sendNewsletterAction, initialState);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const previewHtml = useMemo(
    () => renderNewsletterEmailHtml({ subject, body }),
    [subject, body],
  );

  const canPublish =
    Boolean(subject.trim() && body.trim()) && subscriberCount > 0 && resendReady;
  const actionLabel =
    publishLabel ??
    `Publish to ${subscriberCount} subscriber${subscriberCount === 1 ? "" : "s"}`;

  useEffect(() => {
    if (state.sent) {
      setSubject("");
      setBody("");
    }
    if (state.sent || state.error) setConfirmOpen(false);
  }, [state.sent, state.error]);

  useEffect(() => {
    if (!confirmOpen) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setConfirmOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmOpen]);

  return (
    <form
      action={formAction}
      className="space-y-4"
      onSubmit={(event) => {
        if (!confirmOpen) {
          event.preventDefault();
          if (canPublish) setConfirmOpen(true);
        }
      }}
    >
      <input type="hidden" name="confirm" value="publish" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.92fr)]">
        <div className="space-y-3">
          <p className="text-[11px] text-ink-dim">
            From {fromValue} · To {subscriberCount} subscriber
            {subscriberCount === 1 ? "" : "s"}
          </p>
          <label className="block space-y-1.5">
            <span className="flex items-center justify-between text-xs font-medium uppercase tracking-wider text-ink-muted">
              Subject
              <span className="normal-case tracking-normal text-ink-dim">
                {subject.length}/200
              </span>
            </span>
            <input
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
              placeholder="What this week's newsletter is about"
              className="w-full rounded-xl border border-surface-border bg-surface-base px-3 py-2.5 text-sm text-ink outline-none ring-accent-cyan/40 focus:ring-2"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium uppercase tracking-wider text-ink-muted">
              Message
            </span>
            <textarea
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={14}
              placeholder="Write this week's newsletter. A blank line starts a new paragraph."
              className="w-full resize-y rounded-xl border border-surface-border bg-surface-base px-3 py-3 text-sm leading-relaxed text-ink outline-none ring-accent-cyan/40 focus:ring-2"
            />
          </label>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-ink-muted">
            How it looks in the inbox
          </p>
          <div className="overflow-hidden border border-white/10" style={{ background: "#070b14" }}>
            <iframe
              title="Weekly newsletter preview"
              sandbox=""
              srcDoc={previewHtml}
              className="h-[420px] w-full"
              style={{ background: "#070b14" }}
            />
          </div>
        </div>
      </div>

      {state.error ? (
        <p className="rounded-lg border border-accent-rose/40 bg-accent-rose/10 px-3 py-2 text-sm text-accent-rose">
          {state.error}
        </p>
      ) : null}
      {state.sent ? (
        <p className="rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 px-3 py-2 text-sm text-accent-emerald">
          Published to {state.sent} subscriber{state.sent === 1 ? "" : "s"}.
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs text-ink-dim">
          <Mail className="size-3.5" />
          {subscriberCount} subscriber{subscriberCount === 1 ? "" : "s"} on the list
          {resendReady ? "" : " · Gmail not connected yet"}
        </p>
        <button
          type="button"
          disabled={!canPublish}
          onClick={() => setConfirmOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-accent-cyan px-4 py-2 text-sm font-medium text-surface-base disabled:opacity-50"
          title={
            !resendReady
              ? "Connect Gmail in Settings first"
              : subscriberCount === 0
                ? "No newsletter subscribers yet"
                : "Review, then publish to the opt-in list"
          }
        >
          <Send className="size-3.5" />
          {actionLabel}
        </button>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="panel-title">Publish email</p>
            <h3 className="mt-1 text-lg font-semibold text-ink">
              Send to {subscriberCount} subscriber
              {subscriberCount === 1 ? "" : "s"}?
            </h3>
            <p className="mt-2 text-sm text-ink-muted">
              This publishes{" "}
              <span className="text-ink">
                “{subject.trim() || "Untitled"}”
              </span>{" "}
              to every opt-in address in the newsletter list. It cannot be
              undone.
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-lg border border-surface-border px-4 py-2 text-sm text-ink-muted hover:text-ink"
              >
                Cancel
              </button>
              <PublishButton label="Publish now" disabled={!canPublish} />
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
