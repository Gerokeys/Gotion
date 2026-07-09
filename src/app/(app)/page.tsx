import { db } from "@/lib/db";
import { startOfWeekStr, todayStr } from "@/lib/dates";
import { quitStreaks } from "@/lib/streaks";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import type { ClientTask } from "@/components/tasks/types";
import type { Priority, TaskStatus } from "@/lib/types";

// Every stat here comes straight from the database and changes constantly
// (task completions, check-ins, sleep logs) — never let Next cache this page.
export const dynamic = "force-dynamic";

const QUIT_START_KEY = "quit_start_date";

function greetingForHour(hour: number): string {
  if (hour < 5) return "Still up?";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const today = todayStr();
  const weekStart = startOfWeekStr(today);

  const [tasks, projects, quitStart, relapses, focusSessions, lastSleep, habits, habitCheckinsToday] =
    await Promise.all([
      db.task.findMany({
        where: { dueDate: { lte: today }, status: { not: "done" } },
        include: { tags: { include: { tag: true } } },
        orderBy: [{ dueDate: "asc" }, { priority: "asc" }],
        take: 8,
      }),
      db.project.findMany({ where: { archived: false }, orderBy: { position: "asc" } }),
      db.setting.findUnique({ where: { key: QUIT_START_KEY } }),
      db.relapse.findMany({ orderBy: { date: "asc" }, select: { date: true } }),
      db.focusSession.findMany({
        where: { kind: "focus", date: { gte: weekStart, lte: today } },
        select: { durationMin: true },
      }),
      db.sleepLog.findFirst({ orderBy: { date: "desc" } }),
      db.habit.findMany({ where: { archived: false }, select: { id: true } }),
      db.habitCheckin.findMany({ where: { date: today }, select: { habitId: true } }),
    ]);

  const { current: quitCurrent } = quitStreaks(
    relapses.map((r) => r.date),
    quitStart?.value ?? today
  );

  const focusMinutesThisWeek = focusSessions.reduce((s, f) => s + f.durationMin, 0);

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

  return (
    <DashboardClient
      greeting={greetingForHour(new Date().getHours())}
      initialTasks={clientTasks}
      projects={projects}
      quitCurrent={quitCurrent}
      focusMinutesThisWeek={focusMinutesThisWeek}
      lastSleep={lastSleep ? { durationMin: lastSleep.durationMin, quality: lastSleep.quality } : null}
      habitsCheckedToday={habitCheckinsToday.length}
      habitsTotal={habits.length}
    />
  );
}
