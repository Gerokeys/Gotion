import { db } from "@/lib/db";
import { addDays, todayStr } from "@/lib/dates";
import { HabitsPageClient } from "@/components/habits/habits-page-client";

export const dynamic = "force-dynamic";

export default async function HabitsPage() {
  const start = addDays(todayStr(), -7 * 26);

  const habits = await db.habit.findMany({
    where: { archived: false },
    orderBy: { position: "asc" },
    include: { checkins: { where: { date: { gte: start } }, select: { date: true } } },
  });

  const data = habits.map((h) => ({
    id: h.id,
    name: h.name,
    emoji: h.emoji,
    color: h.color,
    checkins: h.checkins.map((c) => c.date),
  }));

  return <HabitsPageClient initialHabits={data} />;
}
