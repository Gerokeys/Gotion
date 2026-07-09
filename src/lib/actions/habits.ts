"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

function touch() {
  revalidatePath("/habits");
  revalidatePath("/");
}

export async function createHabit(name: string, emoji?: string, color?: string) {
  const count = await db.habit.count({ where: { archived: false } });
  const habit = await db.habit.create({ data: { name, emoji, color, position: count } });
  touch();
  return habit;
}

export async function archiveHabit(id: string) {
  await db.habit.update({ where: { id }, data: { archived: true } });
  touch();
}

export async function toggleHabitCheckin(habitId: string, date: string, checked: boolean) {
  if (checked) {
    await db.habitCheckin.upsert({
      where: { habitId_date: { habitId, date } },
      update: {},
      create: { habitId, date },
    });
  } else {
    await db.habitCheckin.deleteMany({ where: { habitId, date } });
  }
  touch();
}
