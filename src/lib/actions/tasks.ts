"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { Priority, TaskStatus } from "@/lib/types";

function touch() {
  revalidatePath("/");
  revalidatePath("/tasks");
  revalidatePath("/tasks/board");
}

export async function createTask(input: {
  title: string;
  dueDate?: string | null;
  priority?: Priority;
  projectId?: string | null;
  tagIds?: string[];
}) {
  const task = await db.task.create({
    data: {
      title: input.title,
      dueDate: input.dueDate ?? null,
      priority: input.priority ?? 4,
      projectId: input.projectId ?? null,
      position: Date.now(),
      tags: input.tagIds?.length
        ? { create: input.tagIds.map((tagId) => ({ tagId })) }
        : undefined,
    },
  });
  touch();
  return task;
}

export async function updateTask(
  id: string,
  input: Partial<{
    title: string;
    notes: string | null;
    dueDate: string | null;
    priority: Priority;
    projectId: string | null;
  }>
) {
  await db.task.update({ where: { id }, data: input });
  touch();
}

export async function setTaskTags(id: string, tagIds: string[]) {
  await db.taskTag.deleteMany({ where: { taskId: id } });
  if (tagIds.length) {
    await db.taskTag.createMany({ data: tagIds.map((tagId) => ({ taskId: id, tagId })) });
  }
  touch();
}

export async function setTaskStatus(id: string, status: TaskStatus) {
  await db.task.update({
    where: { id },
    data: { status, completedAt: status === "done" ? new Date() : null },
  });
  touch();
}

export async function toggleTaskDone(id: string, done: boolean) {
  return setTaskStatus(id, done ? "done" : "todo");
}

export async function reorderTasks(updates: { id: string; status: TaskStatus; position: number }[]) {
  await db.$transaction(
    updates.map((u) =>
      db.task.update({
        where: { id: u.id },
        data: { status: u.status, position: u.position },
      })
    )
  );
  touch();
}

export async function deleteTask(id: string) {
  await db.task.delete({ where: { id } });
  touch();
}

export async function createProject(name: string, color?: string) {
  const count = await db.project.count();
  const project = await db.project.create({ data: { name, color, position: count } });
  touch();
  return project;
}

export async function deleteProject(id: string) {
  await db.project.delete({ where: { id } });
  touch();
}

export async function getOrCreateTag(name: string) {
  const trimmed = name.trim().toLowerCase();
  const existing = await db.tag.findUnique({ where: { name: trimmed } });
  if (existing) return existing;
  return db.tag.create({ data: { name: trimmed } });
}
