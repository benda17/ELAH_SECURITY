import { KanbanBoard } from "@/components/roadmap-dashboard/kanban-board";
import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "ELAH Roadmap · Kanban" };

export default async function KanbanPage() {
  const { tasks } = await loadRoadmapPageData();
  return (
    <div className="space-y-4">
      <header>
        <p className="panel-title">Kanban board</p>
        <h1 className="text-2xl font-semibold">Execution board</h1>
        <p className="text-sm text-ink-muted">
          Drag cards between columns or use the status dropdown. Changes persist
          to the database.
        </p>
      </header>
      <KanbanBoard tasks={tasks} />
    </div>
  );
}
