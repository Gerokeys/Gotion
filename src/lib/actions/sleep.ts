"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { sleepDurationMin } from "@/lib/dates";

function touch() {
  revalidatePath("/sleep");
  revalidatePath("/");
}

export async function upsertSleepLog(input: {
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  notes?: string;
}) {
  const durationMin = sleepDurationMin(input.bedtime, input.wakeTime);
  await db.sleepLog.upsert({
    where: { date: input.date },
    update: {
      bedtime: input.bedtime,
      wakeTime: input.wakeTime,
      quality: input.quality,
      notes: input.notes,
      durationMin,
    },
    create: {
      date: input.date,
      bedtime: input.bedtime,
      wakeTime: input.wakeTime,
      quality: input.quality,
      notes: input.notes,
      durationMin,
    },
  });
  touch();
}

export async function deleteSleepLog(date: string) {
  await db.sleepLog.delete({ where: { date } });
  touch();
}
