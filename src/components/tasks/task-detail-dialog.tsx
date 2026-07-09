"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PrioritySelect } from "@/components/tasks/priority-select";
import type { ClientProject, ClientTag, ClientTask } from "@/components/tasks/types";
import { deleteTask, getOrCreateTag, setTaskTags, updateTask } from "@/lib/actions/tasks";
import type { Priority } from "@/lib/types";

export function TaskDetailDialog({
  task,
  projects,
  open,
  onOpenChange,
  onSaved,
  onDeleted,
}: {
  task: ClientTask;
  projects: ClientProject[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: (patch: Partial<ClientTask>) => void;
  onDeleted: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [projectId, setProjectId] = useState<string | null>(task.projectId);
  const [tags, setTags] = useState<ClientTag[]>(task.tags);
  const [tagInput, setTagInput] = useState("");
  const [pending, startTransition] = useTransition();

  function addTag() {
    const name = tagInput.trim();
    if (!name) return;
    setTagInput("");
    if (tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) return;
    startTransition(async () => {
      const tag = await getOrCreateTag(name);
      setTags((prev) => [...prev, tag]);
    });
  }

  function removeTag(id: string) {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }

  function save() {
    const patch = {
      title: title.trim() || "Untitled task",
      notes: notes.trim() || null,
      dueDate: dueDate || null,
      priority,
      projectId,
    };
    startTransition(async () => {
      await updateTask(task.id, patch);
      await setTaskTags(task.id, tags.map((t) => t.id));
      onSaved({ ...patch, tags });
      onOpenChange(false);
      toast.success("Task updated");
    });
  }

  function remove() {
    startTransition(async () => {
      await deleteTask(task.id);
      onDeleted();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="task-title">Title</Label>
            <Input id="task-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-notes">Notes</Label>
            <textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="task-due">Due date</Label>
              <Input
                id="task-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Priority</Label>
              <PrioritySelect value={priority} onChange={setPriority} />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label>Project</Label>
            <Select
              value={projectId ?? "none"}
              onValueChange={(v) => setProjectId(v === "none" ? null : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="task-tags">Tags</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span
                  key={t.id}
                  className="flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
                >
                  {t.name}
                  <button onClick={() => removeTag(t.id)} aria-label={`Remove ${t.name}`}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              id="task-tags"
              placeholder="Add a tag and press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={remove}>
            Delete
          </Button>
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
