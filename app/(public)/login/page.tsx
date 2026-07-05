import Link from "next/link";
import { Lock } from "lucide-react";
import { BrandMark } from "@/components/layout/brand-mark";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/auth/demo-accounts";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const initialError =
    searchParams.error === "forbidden"
      ? "You do not have access to that area. Please sign in with an authorized account."
      : undefined;

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-line bg-gradient-to-b from-bg-panel via-bg-base to-bg-base p-12 lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <BrandMark size="lg" />
            <div>
              <div className="text-base font-semibold tracking-tight text-ink">
                ELAH Bank
              </div>
              <div className="text-[11px] uppercase tracking-widest text-accent-cyan">
                Simulation Environment
              </div>
            </div>
          </div>
        </div>

        <div>
          <h1 className="max-w-md text-3xl font-semibold leading-tight tracking-tight text-ink">
            A controlled banking environment for{" "}
            <span className="text-accent-gold">reasoning-level</span> security
            research on Agentic AI.
          </h1>
          <p className="mt-4 max-w-md text-sm text-ink-muted">
            PROJECT ELAH simulates customer, manager, and security-reviewer
            banking flows. Every meaningful action generates a structured log so
            we can later demonstrate prompt injection, unauthorized tool use,
            and intent/action mismatch in AI agents.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs text-ink-muted">
          <div className="elah-panel p-3">
            <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
              Customer portal
            </div>
            <div className="mt-1 text-ink">Balances · Transfers · Documents</div>
          </div>
          <div className="elah-panel p-3">
            <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
              Manager portal
            </div>
            <div className="mt-1 text-ink">Approvals · Notes · Audit trail</div>
          </div>
          <div className="elah-panel p-3">
            <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
              Security portal
            </div>
            <div className="mt-1 text-ink">Risk events · Agent logs</div>
          </div>
          <div className="elah-panel p-3">
            <div className="text-[10px] uppercase tracking-widest text-ink-subtle">
              Future agents
            </div>
            <div className="mt-1 text-ink">Prompt-injection scenarios</div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <BrandMark size="md" />
            <div>
              <div className="text-base font-semibold tracking-tight text-ink">
                ELAH Bank
              </div>
              <div className="text-[11px] uppercase tracking-widest text-accent-cyan">
                Simulation
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-ink">
            Sign in to your simulated account
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Use a seeded demo identity below to explore the customer, manager,
            and security portals.
          </p>

          <LoginForm initialError={initialError} />

          <div className="mt-8 border-t border-line pt-6">
            <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-widest text-ink-subtle">
              <Lock className="size-3.5" />
              Demo credentials — password{" "}
              <code className="rounded bg-bg-panel/60 px-1.5 py-0.5 font-mono text-[11px] text-accent-gold border border-line">
                {DEMO_PASSWORD}
              </code>
            </div>
            <ul className="space-y-1.5 text-xs text-ink-muted">
              {DEMO_ACCOUNTS.map((account) => (
                <li key={account.email}>
                  <span className="font-mono text-ink">{account.email}</span> —{" "}
                  {account.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 text-xs text-ink-subtle">
            <Link
              href="/forgot-password"
              className="hover:text-accent-cyan"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
