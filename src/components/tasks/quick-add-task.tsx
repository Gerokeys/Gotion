"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PrioritySelect } from "@/components/tasks/priority-select";
import { createTask } from "@/lib/actions/tasks";
import type { Priority } from "@/lib/types";
import type { ClientTask } from "@/components/tasks/types";

export function QuickAddTask({
  defaultDueDate,
  onCreated,
}: {
  defaultDueDate?: string | null;
  onCreated: (task: ClientTask) => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Priority>(4);
  const [pending, startTransition] = useTransition();

  function submit() {
    const value = title.trim();
    if (!value) return;
    startTransition(async () => {
      const task = await createTask({ title: value, dueDate: defaultDueDate ?? null, priority });
      setTitle("");
      setPriority(4);
      onCreated({
        id: task.id,
        title: task.title,
        notes: task.notes,
        dueDate: task.dueDate,
        priority: task.priority as Priority,
        status: task.status as ClientTask["status"],
        position: task.position,
        projectId: task.projectId,
        tags: [],
      });
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2">
      <Plus className="size-4 shrink-0 text-muted-foreground" />
      <Input
        placeholder="Add a task…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        className="h-8 border-none px-0 shadow-none focus-visible:ring-0"
      />
      <PrioritySelect value={priority} onChange={setPriority} />
      <Button size="sm" onClick={submit} disabled={pending || !title.trim()}>
        Add
      </Button>
    </div>
  );
}
