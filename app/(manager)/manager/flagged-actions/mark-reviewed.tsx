"use client";

import { useTransition, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { reviewRiskEventAction } from "@/app/actions/manager";

export function MarkReviewedForm({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="rounded-lg border border-accent-emerald/40 bg-accent-emerald/10 px-3 py-2 text-xs text-accent-emerald">
        Marked reviewed
      </div>
    );
  }

  return (
    <form
      action={async (fd) => {
        startTransition(async () => {
          const res = await reviewRiskEventAction(fd);
          if (res?.ok) setDone(true);
        });
      }}
      className="flex w-full max-w-md flex-col gap-2"
    >
      <input type="hidden" name="id" value={id} />
      <textarea
        name="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Reviewer note (optional)"
        rows={2}
        maxLength={500}
        className="block w-full rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:border-accent-cyan focus:outline-none"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        Mark reviewed
      </Button>
    </form>
  );
}
