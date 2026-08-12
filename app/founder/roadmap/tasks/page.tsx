import { TaskTable } from "@/components/roadmap-dashboard/task-table";
import { loadRoadmapPageData } from "@/lib/roadmap/server";

export const metadata = { title: "ELAH Roadmap · Tasks" };

export default async function TasksPage() {
  const { tasks } = await loadRoadmapPageData();
  return (
    <div className="space-y-4">
      <header>
        <p className="panel-title">Task table</p>
        <h1 className="text-2xl font-semibold">All tasks</h1>
        <p className="text-sm text-ink-muted">
          {tasks.length} tasks · click a title for full details · inline edit status & owner
        </p>
      </header>
      <TaskTable tasks={tasks} />
    </div>
  );
}
