import { TaskTable } from "@/components/roadmap-dashboard/task-table";
import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "APACT · Tasks" };

export default async function TasksPage() {
  const { tasks } = await loadRoadmapPageData();
  return (
    <div className="space-y-4">
      <header>
        <p className="panel-title">APACT task list</p>
        <h1 className="text-2xl font-semibold">All tasks</h1>
        <p className="max-w-3xl text-sm text-ink-muted">
          {tasks.length} tasks on the execution board, from product definition
          through the fundraising narrative. Click a title for the full brief.
          Status and owner edit inline.
        </p>
      </header>
      <TaskTable tasks={tasks} />
    </div>
  );
}
