import { getContentEngineConfig } from "@/lib/founder/content-engine/config";

export const metadata = { title: "ELAH · Founder Settings" };

export default function FounderSettingsPage() {
  const config = getContentEngineConfig();

  return (
    <div className="space-y-6">
      <header>
        <p className="panel-title">Configuration</p>
        <h1 className="text-2xl font-semibold">Founder Settings</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Environment and deployment checklist. Add values in Vercel, not in this UI.
        </p>
      </header>

      <section className="panel">
        <h2 className="mb-3 text-sm font-semibold">Environment variables</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-surface-border text-[10px] uppercase text-ink-dim">
                <th className="py-2 pr-4">Variable</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {config.envVars.map((v) => (
                <tr key={v.key} className="border-b border-surface-border/40">
                  <td className="py-2 pr-4">
                    <code>{v.key}</code>
                  </td>
                  <td className="py-2 pr-4">
                    {v.configured ? (
                      <span className="text-accent-emerald">Configured</span>
                    ) : (
                      <span className={v.required ? "text-accent-rose" : "text-ink-dim"}>
                        {v.required ? "Required" : "Optional"}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-xs text-ink-muted">{v.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2 className="mb-2 text-sm font-semibold">Banking app URL</h2>
        <p className="text-sm text-ink-muted">
          <code>BANKING_APP_URL</code> — links the Banking System sidebar to the live demo
          (default <code>http://localhost:3002</code>).
        </p>
      </section>
    </div>
  );
}
