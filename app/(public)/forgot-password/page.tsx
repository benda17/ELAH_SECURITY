import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/layout/brand-mark";
import { ForgotPasswordForm } from "./forgot-password-form";

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
          This is a simulated recovery request. No email is sent and the
          password does not change. The attempt is logged so ELAH can treat
          credential recovery as a monitorable — sometimes high-risk — action.
        </p>

        <div className="elah-panel mt-6 p-6">
          <ForgotPasswordForm />
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
