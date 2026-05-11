"use client";

import { useFormState, useFormStatus } from "react-dom";
import { useState } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import {
  decideApprovalAction,
  type ManagerActionState,
} from "@/app/actions/manager";
import { Button } from "@/components/ui/button";

const initialState: ManagerActionState = {};

export function ApprovalDecisionForm({ approvalId }: { approvalId: string }) {
  const [state, formAction] = useFormState(decideApprovalAction, initialState);
  const [reason, setReason] = useState("");

  return (
    <form action={formAction} className="flex flex-col gap-2 min-w-[280px]">
      <input type="hidden" name="approvalId" value={approvalId} />
      <textarea
        name="reason"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason / decision note (logged)"
        rows={2}
        maxLength={500}
        className="block w-full rounded-lg border border-line bg-bg-panel/60 px-3 py-2 text-xs text-ink placeholder:text-ink-subtle focus:border-accent-cyan focus:outline-none"
      />
      <div className="flex items-center justify-end gap-2">
        <ApproveButton />
        <RejectButton />
      </div>
      {state?.error ? (
        <div className="flex items-start gap-2 text-xs text-accent-rose">
          <AlertTriangle className="mt-0.5 size-3.5" />
          <span>{state.error}</span>
        </div>
      ) : null}
      {state?.message ? (
        <div className="text-xs text-accent-emerald">{state.message}</div>
      ) : null}
    </form>
  );
}

function ApproveButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="decision"
      value="approved"
      variant="success"
      size="sm"
      disabled={pending}
    >
      <Check className="size-3.5" /> Approve
    </Button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="decision"
      value="rejected"
      variant="danger"
      size="sm"
      disabled={pending}
    >
      <X className="size-3.5" /> Reject
    </Button>
  );
}
