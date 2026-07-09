"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useDroppable } from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { dueLabel } from "@/lib/dates";
import { PRIORITY_META, type TaskStatus } from "@/lib/types";
import { createTask, reorderTasks } from "@/lib/actions/tasks";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import type { ClientProject, ClientTask } from "@/components/tasks/types";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "todo", label: "To do" },
  { status: "doing", label: "In progress" },
  { status: "done", label: "Done" },
];

export function BoardView({
  initialTasks,
  projects,
}: {
  initialTasks: ClientTask[];
  projects: ClientProject[];
}) {
  const [tasks, setTasks] = useState(initialTasks);
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const columns = useMemo(() => {
    const map: Record<TaskStatus, ClientTask[]> = { todo: [], doing: [], done: [] };
    for (const t of [...tasks].sort((a, b) => a.position - b.position)) map[t.status].push(t);
    return map;
  }, [tasks]);

  function findColumn(id: string): TaskStatus | null {
    if (id in columns) return id as TaskStatus;
    return tasks.find((t) => t.id === id)?.status ?? null;
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeCol = findColumn(String(active.id));
    const overCol = findColumn(String(over.id));
    if (!activeCol || !overCol || activeCol === overCol) return;

    setTasks((prev) => prev.map((t) => (t.id === active.id ? { ...t, status: overCol } : t)));
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    if (!activeTask) return;
    const overCol = findColumn(String(over.id));
    if (!overCol) return;

    const targetList = columns[overCol].filter((t) => t.id !== active.id);
    const overIndex = targetList.findIndex((t) => t.id === over.id);
    const insertAt = overIndex === -1 ? targetList.length : overIndex;

    const before = targetList[insertAt - 1];
    const after = targetList[insertAt];
    const position = before && after
      ? (before.position + after.position) / 2
      : before
        ? before.position + 1
        : after
          ? after.position - 1
          : 0;

    setTasks((prev) =>
      prev.map((t) => (t.id === active.id ? { ...t, status: overCol, position } : t))
    );
    reorderTasks([{ id: activeTask.id, status: overCol, position }]);
  }

  async function quickAdd(status: TaskStatus, title: string) {
    const task = await createTask({ title, priority: 4 });
    if (status !== "todo") await reorderTasks([{ id: task.id, status, position: task.position }]);
    setTasks((prev) => [
      ...prev,
      {
        id: task.id,
        title: task.title,
        notes: task.notes,
        dueDate: task.dueDate,
        priority: task.priority as ClientTask["priority"],
        status,
        position: task.position,
        projectId: task.projectId,
        tags: [],
      },
    ]);
  }

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <div className="h-full overflow-x-auto p-6">
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Board</h1>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4">
          {COLUMNS.map((col) => (
            <Column
              key={col.status}
              status={col.status}
              label={col.label}
              tasks={columns[col.status]}
              projects={projects}
              projectById={projectById}
              onQuickAdd={(title) => quickAdd(col.status, title)}
              onTaskChange={(id, patch) =>
                setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
              }
              onTaskDeleted={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} project={null} onClick={() => {}} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  status,
  label,
  tasks,
  projects,
  projectById,
  onQuickAdd,
  onTaskChange,
  onTaskDeleted,
}: {
  status: TaskStatus;
  label: string;
  tasks: ClientTask[];
  projects: ClientProject[];
  projectById: Map<string, ClientProject>;
  onQuickAdd: (title: string) => void;
  onTaskChange: (id: string, patch: Partial<ClientTask>) => void;
  onTaskDeleted: (id: string) => void;
}) {
  const { setNodeRef } = useDroppable({ id: status });
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  function submit() {
    const value = title.trim();
    if (!value) {
      setAdding(false);
      return;
    }
    onQuickAdd(value);
    setTitle("");
  }

  return (
    <div ref={setNodeRef} className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/40 p-2">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-sm font-medium">{label}</h2>
        <span className="text-xs text-muted-foreground">{tasks.length}</span>
      </div>

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <SortableCard
              key={task.id}
              task={task}
              projects={projects}
              project={task.projectId ? projectById.get(task.projectId) : null}
              onChange={(patch) => onTaskChange(task.id, patch)}
              onDeleted={() => onTaskDeleted(task.id)}
            />
          ))}
        </div>
      </SortableContext>

      {adding ? (
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={submit}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") {
              setTitle("");
              setAdding(false);
            }
          }}
          placeholder="Task title…"
          className="mt-2 rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none"
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="mt-2 flex items-center gap-1 rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-3.5" />
          Add task
        </button>
      )}
    </div>
  );
}

function SortableCard({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} project={project} onClick={() => setOpen(true)} />
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
    </div>
  );
}

function TaskCard({
  task,
  project,
  onClick,
}: {
  task: ClientTask;
  project?: ClientProject | null;
  onClick: () => void;
}) {
  const due = task.dueDate ? dueLabel(task.dueDate) : null;

  return (
    <button
      onClick={onClick}
      className="w-full cursor-grab rounded-md border border-border bg-card p-3 text-left text-sm shadow-sm transition-colors hover:border-primary/40 active:cursor-grabbing"
    >
      <p className={cn(task.status === "done" && "text-muted-foreground line-through")}>
        {task.title}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {task.priority < 4 && (
          <span className={PRIORITY_META[task.priority].className}>
            {PRIORITY_META[task.priority].label}
          </span>
        )}
        {due && <span className={cn(due.overdue && task.status !== "done" && "text-destructive")}>{due.label}</span>}
        {project && (
          <span
            className="rounded-full px-1.5 py-0.5"
            style={{ backgroundColor: `${project.color ?? "#8884"}22`, color: project.color ?? undefined }}
          >
            {project.name}
          </span>
        )}
      </div>
    </button>
  );
}
