import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex items-center gap-3">
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
          Forgot password
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          This is a simulated recovery flow. No real email is ever sent.
        </p>

        <div className="elah-panel mt-6 p-6">
          <div className="flex items-center gap-2 text-sm text-accent-cyan">
            <MailCheck className="size-4" />
            <span>Recovery is disabled in the simulation.</span>
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            In a real deployment, this page would generate a recovery token and
            email it through an audited channel. For PROJECT ELAH, please use a
            seeded demo identity with password{" "}
            <code className="rounded bg-bg-panel/60 px-1 py-0.5 font-mono text-accent-gold border border-line">
              DemoPass123!
            </code>
            .
          </p>
        </div>

        <div className="mt-6">
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
