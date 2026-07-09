"use client";

import { useMemo, useState } from "react";
import { todayStr } from "@/lib/dates";
import { QuickAddTask } from "@/components/tasks/quick-add-task";
import { TaskRow } from "@/components/tasks/task-row";
import type { ClientProject, ClientTask } from "@/components/tasks/types";

export function TodayView({
  initialTasks,
  projects,
}: {
  initialTasks: ClientTask[];
  projects: ClientProject[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const today = todayStr();

  function patch(id: string, p: Partial<ClientTask>) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));
  }

  function remove(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const { overdue, dueToday, completed } = useMemo(() => {
    const overdue: ClientTask[] = [];
    const dueToday: ClientTask[] = [];
    const completed: ClientTask[] = [];
    for (const t of tasks) {
      if (t.status === "done") {
        completed.push(t);
      } else if (t.dueDate && t.dueDate < today) {
        overdue.push(t);
      } else if (t.dueDate === today) {
        dueToday.push(t);
      }
    }
    return { overdue, dueToday, completed };
  }, [tasks, today]);

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {dueToday.length + overdue.length} task{dueToday.length + overdue.length === 1 ? "" : "s"} on
        your plate.
      </p>

      <div className="mt-6">
        <QuickAddTask
          defaultDueDate={today}
          onCreated={(t) => setTasks((prev) => [...prev, t])}
        />
      </div>

      {overdue.length > 0 && (
        <Section title="Overdue">
          {overdue.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              projects={projects}
              project={t.projectId ? projectById.get(t.projectId) : null}
              onChange={(p) => patch(t.id, p)}
              onDeleted={() => remove(t.id)}
            />
          ))}
        </Section>
      )}

      <Section title="Today">
        {dueToday.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">Nothing due today. Nice.</p>
        ) : (
          dueToday.map((t) => (
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
      </Section>

      {completed.length > 0 && (
        <Section title={`Completed (${completed.length})`}>
          {completed.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              projects={projects}
              project={t.projectId ? projectById.get(t.projectId) : null}
              onChange={(p) => patch(t.id, p)}
              onDeleted={() => remove(t.id)}
            />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6">
      <h2 className="mb-1 px-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {title}
      </h2>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
