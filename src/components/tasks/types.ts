import type { Priority, TaskStatus } from "@/lib/types";

export type ClientTag = { id: string; name: string; color: string | null };

export type ClientProject = { id: string; name: string; color: string | null };

export type ClientTask = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string | null;
  priority: Priority;
  status: TaskStatus;
  position: number;
  projectId: string | null;
  tags: ClientTag[];
};
