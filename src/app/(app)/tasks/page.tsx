import { db } from "@/lib/db";
import { addDays, startOfDayUTC, todayStr } from "@/lib/dates";
import { TodayView } from "@/components/tasks/today-view";
import type { ClientTask } from "@/components/tasks/types";
import type { Priority, TaskStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TasksTodayPage() {
  const today = todayStr();
  const startOfToday = startOfDayUTC(today);
  const startOfTomorrow = startOfDayUTC(addDays(today, 1));

  const [tasks, projects] = await Promise.all([
    db.task.findMany({
      where: {
        OR: [
          { dueDate: { lte: today }, status: { not: "done" } },
          { status: "done", completedAt: { gte: startOfToday, lt: startOfTomorrow } },
        ],
      },
      include: { tags: { include: { tag: true } } },
      orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
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

  return <TodayView initialTasks={clientTasks} projects={projects} />;
}
