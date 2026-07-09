import { db } from "@/lib/db";
import { addDays, todayStr, weekdayShort } from "@/lib/dates";
import { FocusPageClient } from "@/components/focus/focus-page-client";

export const dynamic = "force-dynamic";

export default async function FocusPage() {
  const today = todayStr();
  const start = addDays(today, -6);

  const sessions = await db.focusSession.findMany({
    where: { kind: "focus", date: { gte: start, lte: today } },
    select: { date: true, durationMin: true },
  });

  const totals = new Map<string, number>();
  for (const s of sessions) totals.set(s.date, (totals.get(s.date) ?? 0) + s.durationMin);

  const daily = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(start, i);
    return { label: weekdayShort(date), value: totals.get(date) ?? 0 };
  });

  return <FocusPageClient initialDaily={daily} />;
}
