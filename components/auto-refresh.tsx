"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pause, Play, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESETS: { label: string; value: number }[] = [
  { label: "5s", value: 5 },
  { label: "10s", value: 10 },
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "5m", value: 300 },
];

const STORAGE_KEY = "elah-analytics:autorefresh-seconds";

export function AutoRefresh({
  defaultSeconds = 10,
}: {
  defaultSeconds?: number;
}) {
  const router = useRouter();
  const [seconds, setSeconds] = useState<number>(defaultSeconds);
  const [isPending, startTransition] = useTransition();
  const [secondsUntil, setSecondsUntil] = useState<number>(defaultSeconds);
  const intervalRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(Date.now());

  // Load persisted preference once on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw != null) {
        const n = Number(raw);
        if (Number.isFinite(n) && n >= 0) setSeconds(n);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const paused = seconds === 0;

  // Refresh loop
  useEffect(() => {
    if (paused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      return;
    }
    setSecondsUntil(seconds);
    lastTickRef.current = Date.now();
    intervalRef.current = window.setInterval(() => {
      startTransition(() => {
        router.refresh();
      });
      lastTickRef.current = Date.now();
      setSecondsUntil(seconds);
    }, seconds * 1000) as unknown as number;

    countdownRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastTickRef.current) / 1000);
      setSecondsUntil(Math.max(0, seconds - elapsed));
    }, 500) as unknown as number;

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [seconds, paused, router]);

  function changeInterval(next: number) {
    setSeconds(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
  }

  function refreshNow() {
    startTransition(() => router.refresh());
    lastTickRef.current = Date.now();
    setSecondsUntil(seconds);
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-surface-border bg-surface-raised/70 px-2.5 py-1.5 text-xs">
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "inline-block size-1.5 rounded-full shadow-[0_0_8px_currentColor]",
            paused
              ? "bg-ink-dim text-ink-dim"
              : isPending
                ? "animate-pulse bg-accent-amber text-accent-amber"
                : "animate-pulse bg-accent-emerald text-accent-emerald",
          )}
        />
        <span className="font-semibold uppercase tracking-wider text-ink-muted">
          {paused ? "Paused" : isPending ? "Refreshing…" : "Live"}
        </span>
      </span>

      {!paused && (
        <span className="font-mono text-[11px] tabular-nums text-ink-dim">
          next in {secondsUntil}s
        </span>
      )}

      <span className="h-3.5 w-px bg-surface-border" />

      <div className="flex items-center gap-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => changeInterval(p.value)}
            className={cn(
              "rounded-md px-1.5 py-0.5 text-[11px] font-medium transition",
              seconds === p.value
                ? "bg-accent-cyan/15 text-accent-cyan"
                : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
            )}
            title={`Refresh every ${p.label}`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => changeInterval(paused ? defaultSeconds : 0)}
          className={cn(
            "ml-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition",
            paused
              ? "bg-accent-emerald/15 text-accent-emerald hover:bg-accent-emerald/25"
              : "text-ink-muted hover:bg-surface-subtle hover:text-ink",
          )}
          title={paused ? "Resume auto-refresh" : "Pause auto-refresh"}
          aria-label={paused ? "Resume auto-refresh" : "Pause auto-refresh"}
        >
          {paused ? <Play className="size-3" /> : <Pause className="size-3" />}
        </button>
      </div>

      <span className="h-3.5 w-px bg-surface-border" />

      <button
        onClick={refreshNow}
        className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium text-ink-muted transition hover:bg-surface-subtle hover:text-ink"
        title="Refresh now"
        aria-label="Refresh now"
      >
        <RefreshCw
          className={cn("size-3", isPending && "animate-spin")}
        />
        Now
      </button>
    </div>
  );
}
