import { OutreachBoard } from "@/components/roadmap-dashboard/outreach-board";
import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "APACT · Outreach CRM" };

export default async function OutreachPage() {
  const { contacts } = await loadRoadmapPageData();
  return (
    <div className="space-y-4">
      <header>
        <p className="panel-title">Outreach CRM</p>
        <h1 className="text-2xl font-semibold">Investors and design partners</h1>
        <p className="max-w-3xl text-sm text-ink-muted">
          Pipeline for the APACT pitch: admission for AI agents. A site installs
          an entrance widget. The agent declares a bounded task, passes three
          inert exercises, and receives a short-lived key-bound token. Guest
          travel is the first profile. Overdue follow-ups are highlighted.
        </p>
      </header>
      <OutreachBoard contacts={contacts} />
    </div>
  );
}
