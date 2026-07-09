"use client";

import { useState } from "react";
import Link from "next/link";
import { StatTile } from "@/components/ui/stat-tile";
import { TaskRow } from "@/components/tasks/task-row";
import type { ClientProject, ClientTask } from "@/components/tasks/types";
import { formatDuration } from "@/lib/dates";
import { MILESTONE_META } from "@/lib/types";
import { nextMilestone } from "@/lib/streaks";

export function DashboardClient({
  greeting,
  initialTasks,
  projects,
  quitCurrent,
  focusMinutesThisWeek,
  lastSleep,
  habitsCheckedToday,
  habitsTotal,
}: {
  greeting: string;
  initialTasks: ClientTask[];
  projects: ClientProject[];
  quitCurrent: number;
  focusMinutesThisWeek: number;
  lastSleep: { durationMin: number; quality: number } | null;
  habitsCheckedToday: number;
  habitsTotal: number;
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const next = nextMilestone(quitCurrent);

  function patch(id: string, p: Partial<ClientTask>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));
  }
  function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">{greeting}</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Quit streak" value={`${quitCurrent}d`} />
        <StatTile label="Focus this week" value={formatDuration(focusMinutesThisWeek)} />
        <StatTile
          label="Last night's sleep"
          value={lastSleep ? formatDuration(lastSleep.durationMin) : "—"}
          hint={lastSleep ? `Quality ${lastSleep.quality}/5` : "Not logged yet"}
        />
        <StatTile label="Habits today" value={`${habitsCheckedToday}/${habitsTotal}`} />
      </div>

      {next && (
        <Link
          href="/quit"
          className="mt-4 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-4 transition-colors hover:bg-primary/10"
        >
          <div>
            <p className="text-sm font-medium">
              {next - quitCurrent} day{next - quitCurrent === 1 ? "" : "s"} to {MILESTONE_META[next].name}
            </p>
            <p className="text-xs text-muted-foreground">Keep going — you&apos;re on day {quitCurrent}.</p>
          </div>
          <span className="text-2xl">{MILESTONE_META[next].emoji}</span>
        </Link>
      )}

      <h2 className="mt-8 mb-2 text-sm font-medium text-muted-foreground">Today</h2>
      <div className="flex flex-col rounded-xl border border-border bg-card p-1">
        {tasks.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            Nothing due today. Enjoy the clear runway.
          </p>
        ) : (
          tasks.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              projects={projects}
              project={t.projectId ? projectById.get(t.projectId) : null}
              onChange={(p) => patch(t.id, p)}
              onDeleted={() => remove(t.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
