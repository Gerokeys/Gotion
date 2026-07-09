import { db } from "@/lib/db";
import { todayStr, weekdayShort } from "@/lib/dates";
import { quitStreaks } from "@/lib/streaks";
import { timeOfDayLabel, TIMES_OF_DAY, DEFAULT_REPLACEMENT_ACTIONS } from "@/lib/types";
import { QuitPageClient } from "@/components/quit/quit-page-client";

export const dynamic = "force-dynamic";

const QUIT_START_KEY = "quit_start_date";

async function getQuitStartDate(): Promise<string> {
  const existing = await db.setting.findUnique({ where: { key: QUIT_START_KEY } });
  if (existing) return existing.value;
  const earliest = await db.relapse.findFirst({ orderBy: { date: "asc" } });
  const value = earliest?.date ?? todayStr();
  await db.setting.create({ data: { key: QUIT_START_KEY, value } });
  return value;
}

async function ensureDefaultActions() {
  const actionCount = await db.replacementAction.count();
  if (actionCount === 0) {
    await db.replacementAction.createMany({
      data: DEFAULT_REPLACEMENT_ACTIONS.map((a, i) => ({ ...a, position: i })),
    });
  }
}

export default async function QuitPage() {
  await ensureDefaultActions();

  const [startDate, relapses, today, reasons, actions] = await Promise.all([
    getQuitStartDate(),
    db.relapse.findMany({ orderBy: { date: "asc" } }),
    db.quitDay.findUnique({ where: { date: todayStr() } }),
    db.reason.findMany({ orderBy: { position: "asc" } }),
    db.replacementAction.findMany({ orderBy: { position: "asc" } }),
  ]);

  const { current, best } = quitStreaks(
    relapses.map((r) => r.date),
    startDate
  );

  const byTrigger = countBy(relapses.map((r) => r.trigger ?? "unspecified"));
  const byMood = countBy(relapses.map((r) => r.mood ?? "unspecified"));
  const byWeekday = countBy(relapses.map((r) => weekdayShort(r.date)), WEEKDAY_ORDER);
  const byTimeOfDay = countBy(
    relapses.filter((r) => r.time).map((r) => timeOfDayLabel(Number(r.time!.split(":")[0]))),
    TIMES_OF_DAY.map((t) => t.label)
  );

  return (
    <QuitPageClient
      initialCurrent={current}
      initialBest={best}
      initialCheckedInToday={!!today}
      reasons={reasons}
      actions={actions}
      triggerData={{ byTrigger, byMood, byTimeOfDay, byWeekday }}
    />
  );
}

const WEEKDAY_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function countBy(values: string[], order?: string[]): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  const labels = order ?? [...counts.keys()];
  return labels.filter((l) => counts.has(l)).map((label) => ({ label, value: counts.get(label)! }));
}
