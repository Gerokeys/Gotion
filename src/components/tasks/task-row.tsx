"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { dueLabel } from "@/lib/dates";
import { PRIORITY_META } from "@/lib/types";
import { toggleTaskDone } from "@/lib/actions/tasks";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import type { ClientProject, ClientTask } from "@/components/tasks/types";

export function TaskRow({
  task,
  projects,
  project,
  onChange,
  onDeleted,
}: {
  task: ClientTask;
  projects: ClientProject[];
  project?: ClientProject | null;
  onChange: (patch: Partial<ClientTask>) => void;
  onDeleted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const done = task.status === "done";
  const due = task.dueDate ? dueLabel(task.dueDate) : null;

  function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    const next = !done;
    onChange({ status: next ? "done" : "todo" });
    toggleTaskDone(task.id, next);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent/60"
      >
        <span
          role="checkbox"
          aria-checked={done}
          onClick={toggle}
          className={cn(
            "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            done ? "border-primary bg-primary" : "border-muted-foreground/40 hover:border-primary"
          )}
        >
          {done && <span className="size-1.5 rounded-full bg-primary-foreground" />}
        </span>

        <span className="min-w-0 flex-1">
          <span className={cn("block text-sm", done && "text-muted-foreground line-through")}>
            {task.title}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {task.priority < 4 && (
              <span className={PRIORITY_META[task.priority].className}>
                {PRIORITY_META[task.priority].label}
              </span>
            )}
            {due && <span className={cn(due.overdue && !done && "text-destructive")}>{due.label}</span>}
            {project && (
              <span
                className="rounded-full px-1.5 py-0.5"
                style={{ backgroundColor: `${project.color ?? "#8884"}22`, color: project.color ?? undefined }}
              >
                {project.name}
              </span>
            )}
            {task.tags.map((t) => (
              <span key={t.id} className="rounded-full bg-secondary px-1.5 py-0.5">
                {t.name}
              </span>
            ))}
          </span>
        </span>
      </button>

      {open && (
        <TaskDetailDialog
          task={task}
          projects={projects}
          open={open}
          onOpenChange={setOpen}
          onSaved={onChange}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
