import { OutreachBoard } from "@/components/roadmap-dashboard/outreach-board";
import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "ELAH Roadmap · Outreach CRM" };

export default async function OutreachPage() {
  const { contacts } = await loadRoadmapPageData();
  return (
    <div className="space-y-4">
      <header>
        <p className="panel-title">Outreach CRM</p>
        <h1 className="text-2xl font-semibold">Contacts & pipeline</h1>
        <p className="text-sm text-ink-muted">
          Banks, experts, investors, and design partners. Overdue follow-ups
          highlighted.
        </p>
      </header>
      <OutreachBoard contacts={contacts} />
    </div>
  );
}
