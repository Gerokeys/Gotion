"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import type { BlockType } from "@/lib/types";

export async function createBlock(
  pageId: string,
  afterPosition: number,
  type: BlockType = "text",
  content = "",
  parentId: string | null = null
) {
  const block = await db.block.create({
    data: { pageId, type, content, parentId, position: afterPosition + 0.5 },
  });
  revalidatePath(`/notes/${pageId}`);
  return block;
}

export async function updateBlockContent(id: string, pageId: string, content: string) {
  await db.block.update({ where: { id }, data: { content } });
  revalidatePath(`/notes/${pageId}`);
}

export async function updateBlockType(id: string, pageId: string, type: BlockType) {
  await db.block.update({ where: { id }, data: { type } });
  revalidatePath(`/notes/${pageId}`);
}

export async function toggleBlockChecked(id: string, pageId: string, checked: boolean) {
  await db.block.update({ where: { id }, data: { checked } });
  revalidatePath(`/notes/${pageId}`);
}

export async function toggleBlockCollapsed(id: string, pageId: string, collapsed: boolean) {
  await db.block.update({ where: { id }, data: { collapsed } });
  revalidatePath(`/notes/${pageId}`);
}

export async function moveBlockParent(
  id: string,
  pageId: string,
  parentId: string | null,
  position: number
) {
  await db.block.update({ where: { id }, data: { parentId, position } });
  revalidatePath(`/notes/${pageId}`);
}

export async function deleteBlock(id: string, pageId: string) {
  await db.block.delete({ where: { id } });
  revalidatePath(`/notes/${pageId}`);
}

export async function reorderBlocks(
  pageId: string,
  ordered: { id: string; position: number }[]
) {
  await db.$transaction(
    ordered.map((b) => db.block.update({ where: { id: b.id }, data: { position: b.position } }))
  );
  revalidatePath(`/notes/${pageId}`);
}

export async function quickCapture(text: string) {
  const inbox = await db.page.findFirst({ where: { isInbox: true } });
  const page =
    inbox ?? (await db.page.create({ data: { title: "Quick Capture", isInbox: true, icon: "⚡" } }));
  const last = await db.block.findFirst({
    where: { pageId: page.id },
    orderBy: { position: "desc" },
  });
  await db.block.create({
    data: { pageId: page.id, type: "bullet", content: text, position: (last?.position ?? 0) + 1 },
  });
  revalidatePath(`/notes/${page.id}`);
  revalidatePath("/notes");
}
