import { KanbanBoard } from "@/components/roadmap-dashboard/kanban-board";
import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "APACT · Kanban" };

export default async function KanbanPage() {
  const { tasks } = await loadRoadmapPageData();
  return (
    <div className="space-y-4">
      <header>
        <p className="panel-title">APACT execution board</p>
        <h1 className="text-2xl font-semibold">Execution board</h1>
        <p className="max-w-3xl text-sm text-ink-muted">
          APACT is a CAPTCHA for agents. A website installs an entrance widget.
          The agent declares a bounded task, passes three inert exercises, and
          receives a short-lived key-bound token. Guest travel is the first
          profile. Flight search and guest draft saving are allowed. Payment,
          contracts, and export are blocked.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          Flow: Backlog → In Progress → Blocked → In Review → Done. Filter by
          phase, workstream, importance, or critical path. Critical cards stay
          at the top. Click a card for details. Drag a card or use the status
          dropdown to save a change.
        </p>
      </header>
      <KanbanBoard tasks={tasks} />
    </div>
  );
}
