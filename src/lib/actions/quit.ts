"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { todayStr } from "@/lib/dates";

function touch() {
  revalidatePath("/quit");
  revalidatePath("/");
}

export async function checkInDay(status: "clean" | "relapse", date = todayStr()) {
  await db.quitDay.upsert({
    where: { date },
    update: { status },
    create: { date, status },
  });
  touch();
}

export async function logRelapse(input: {
  date?: string;
  time?: string;
  trigger?: string;
  mood?: string;
  before?: string;
  notes?: string;
}) {
  const date = input.date ?? todayStr();
  await db.$transaction([
    db.quitDay.upsert({
      where: { date },
      update: { status: "relapse" },
      create: { date, status: "relapse" },
    }),
    db.relapse.create({
      data: {
        date,
        time: input.time,
        trigger: input.trigger,
        mood: input.mood,
        before: input.before,
        notes: input.notes,
      },
    }),
  ]);
  touch();
}

export async function logUrge(intensity?: number) {
  const urge = await db.urgeLog.create({
    data: { date: todayStr(), intensity },
  });
  touch();
  return urge;
}

export async function resolveUrge(id: string, outcome: "passed" | "relapsed", action?: string) {
  await db.urgeLog.update({ where: { id }, data: { outcome, action } });
  if (outcome === "relapsed") {
    await logRelapse({});
  }
  touch();
}

export async function addReason(text: string) {
  const count = await db.reason.count();
  const reason = await db.reason.create({ data: { text, position: count } });
  revalidatePath("/quit");
  return reason;
}

export async function deleteReason(id: string) {
  await db.reason.delete({ where: { id } });
  revalidatePath("/quit");
}

export async function addReplacementAction(text: string, emoji?: string) {
  const count = await db.replacementAction.count();
  const action = await db.replacementAction.create({ data: { text, emoji, position: count } });
  revalidatePath("/quit");
  return action;
}

export async function deleteReplacementAction(id: string) {
  await db.replacementAction.delete({ where: { id } });
  revalidatePath("/quit");
}
