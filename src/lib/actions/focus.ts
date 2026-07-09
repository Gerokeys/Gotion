"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { todayStr } from "@/lib/dates";

export async function logFocusSession(durationMin: number, kind: "focus" | "break", note?: string) {
  if (durationMin <= 0) return;
  await db.focusSession.create({
    data: { durationMin, kind, note, date: todayStr() },
  });
  revalidatePath("/focus");
  revalidatePath("/");
}
