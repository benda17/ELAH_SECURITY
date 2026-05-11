"use client";

import { useState, useTransition } from "react";
import { Download, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  bulkDownloadAction,
  downloadDocumentAction,
} from "@/app/actions/documents";

export function DownloadButton({ id, title }: { id: string; title: string }) {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(`Download "${title}"? This download is logged.`)
          )
            return;
          const fd = new FormData();
          fd.set("id", id);
          startTransition(async () => {
            const res = await downloadDocumentAction(fd);
            setMsg(res.message ?? res.error ?? "Download triggered.");
          });
        }}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Download className="size-3.5" />
        )}
        Download
      </Button>
      {msg ? <span className="text-[11px] text-ink-subtle">{msg}</span> : null}
    </div>
  );
}

export function BulkButton() {
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (
            !window.confirm(
              "Bulk-download all documents? This is a high-risk action and will be flagged.",
            )
          )
            return;
          startTransition(async () => {
            const res = await bulkDownloadAction();
            setMsg(res.message ?? res.error ?? "Attempt logged.");
          });
        }}
      >
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <ShieldAlert className="size-3.5" />
        )}
        Bulk download
      </Button>
      {msg ? (
        <span className="max-w-[260px] text-right text-[11px] text-ink-subtle">
          {msg}
        </span>
      ) : null}
    </div>
  );
}
