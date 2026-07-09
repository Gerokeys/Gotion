import { db } from "@/lib/db";
import { addDays, toDateStr, todayStr } from "@/lib/dates";
import { SleepPageClient } from "@/components/sleep/sleep-page-client";

export const dynamic = "force-dynamic";

export default async function SleepPage() {
  const today = todayStr();
  const start = addDays(today, -29);
  const startDate = new Date(start + "T00:00:00");

  const [logs, completedTasks, focusSessions] = await Promise.all([
    db.sleepLog.findMany({
      where: { date: { gte: start, lte: today } },
      orderBy: { date: "asc" },
    }),
    db.task.findMany({
      where: { status: "done", completedAt: { gte: startDate } },
      select: { completedAt: true },
    }),
    db.focusSession.findMany({
      where: { kind: "focus", date: { gte: start, lte: today } },
      select: { date: true, durationMin: true },
    }),
  ]);

  const tasksByDate = new Map<string, number>();
  for (const t of completedTasks) {
    if (!t.completedAt) continue;
    const d = toDateStr(t.completedAt);
    tasksByDate.set(d, (tasksByDate.get(d) ?? 0) + 1);
  }

  const focusByDate = new Map<string, number>();
  for (const s of focusSessions) {
    focusByDate.set(s.date, (focusByDate.get(s.date) ?? 0) + s.durationMin);
  }

  const allDates = new Set([...tasksByDate.keys(), ...focusByDate.keys()]);
  const productivity = Array.from(allDates).map((date) => ({
    date,
    tasksCompleted: tasksByDate.get(date) ?? 0,
    focusMinutes: focusByDate.get(date) ?? 0,
  }));

  return <SleepPageClient initialLogs={logs} productivity={productivity} />;
}
