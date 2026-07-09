"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function createPage(parentId: string | null, title = "Untitled") {
  const siblingCount = await db.page.count({ where: { parentId } });
  const page = await db.page.create({
    data: { title, parentId, position: siblingCount },
  });
  revalidatePath("/notes");
  return page;
}

export async function renamePage(id: string, title: string) {
  await db.page.update({ where: { id }, data: { title: title || "Untitled" } });
  revalidatePath("/notes");
}

export async function setPageIcon(id: string, icon: string | null) {
  await db.page.update({ where: { id }, data: { icon } });
  revalidatePath("/notes");
}

export async function deletePage(id: string) {
  await db.page.delete({ where: { id } });
  revalidatePath("/notes");
}

export async function movePage(id: string, parentId: string | null, position: number) {
  await db.page.update({ where: { id }, data: { parentId, position } });
  revalidatePath("/notes");
}

export async function getOrCreateInboxPage() {
  const existing = await db.page.findFirst({ where: { isInbox: true } });
  if (existing) return existing;
  return db.page.create({ data: { title: "Quick Capture", isInbox: true, icon: "⚡" } });
}
