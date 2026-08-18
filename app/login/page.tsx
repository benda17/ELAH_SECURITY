import Image from "next/image";
import { FounderLoginForm } from "./login-form";

export const metadata = {
  title: "ELAH · Founder Login",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-surface-base px-4 text-ink">
      <div className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised/80 p-8 shadow-[0_1px_0_rgba(255,255,255,0.03)_inset]">
        <div className="flex items-center gap-3">
          <Image src="/elah-logo.png" alt="ELAH" width={40} height={40} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent-gold">
              ELAH Founder Platform
            </p>
            <h1 className="text-xl font-semibold">Sign in</h1>
          </div>
        </div>
        <p className="mt-3 text-sm text-ink-muted">
          Private founder access. Use your platform credentials.
        </p>
        <FounderLoginForm />
      </div>
    </div>
  );
}
