import { db } from "@/lib/db";
import { BoardView } from "@/components/tasks/board-view";
import type { ClientTask } from "@/components/tasks/types";
import type { Priority, TaskStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TasksBoardPage() {
  const [tasks, projects] = await Promise.all([
    db.task.findMany({
      include: { tags: { include: { tag: true } } },
      orderBy: { position: "asc" },
    }),
    db.project.findMany({ where: { archived: false }, orderBy: { position: "asc" } }),
  ]);

  const clientTasks: ClientTask[] = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    notes: t.notes,
    dueDate: t.dueDate,
    priority: t.priority as Priority,
    status: t.status as TaskStatus,
    position: t.position,
    projectId: t.projectId,
    tags: t.tags.map((tt) => tt.tag),
  }));

  return <BoardView initialTasks={clientTasks} projects={projects} />;
}
