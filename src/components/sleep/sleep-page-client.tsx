"use client";

import { useMemo, useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";
import { LineStatChart } from "@/components/charts/line-stat-chart";
import { ScatterStatChart } from "@/components/charts/scatter-stat-chart";
import { SleepLogForm, type SleepLogData } from "@/components/sleep/sleep-log-form";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate, formatDuration, sleepDurationMin, todayStr } from "@/lib/dates";

type LogRow = SleepLogData & { durationMin: number };
type ProductivityRow = { date: string; tasksCompleted: number; focusMinutes: number };

export function SleepPageClient({
  initialLogs,
  productivity,
}: {
  initialLogs: LogRow[];
  productivity: ProductivityRow[];
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [range, setRange] = useState<"7" | "30">("7");

  const today = todayStr();
  const existingToday = logs.find((l) => l.date === today) ?? null;

  function handleSaved(log: SleepLogData) {
    const durationMin = logs.find((l) => l.date === log.date)?.durationMin;
    setLogs((prev) => {
      const withoutDate = prev.filter((l) => l.date !== log.date);
      const merged: LogRow = {
        ...log,
        durationMin: durationMin ?? sleepDurationMin(log.bedtime, log.wakeTime),
      };
      return [...withoutDate, merged].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  const windowed = useMemo(() => {
    const n = Number(range);
    return logs.slice(-n);
  }, [logs, range]);

  const durationSeries = windowed.map((l) => ({
    label: formatDate(l.date),
    value: Math.round((l.durationMin / 60) * 10) / 10,
  }));
  const qualitySeries = windowed.map((l) => ({ label: formatDate(l.date), value: l.quality }));

  const avgDuration =
    windowed.length > 0
      ? Math.round(windowed.reduce((s, l) => s + l.durationMin, 0) / windowed.length)
      : 0;
  const avgQuality =
    windowed.length > 0
      ? Math.round((windowed.reduce((s, l) => s + l.quality, 0) / windowed.length) * 10) / 10
      : 0;

  const productivityByDate = useMemo(
    () => new Map(productivity.map((p) => [p.date, p])),
    [productivity]
  );

  const correlation = windowed
    .map((l) => {
      const p = productivityByDate.get(l.date);
      if (!p) return null;
      return {
        date: formatDate(l.date),
        hours: Math.round((l.durationMin / 60) * 10) / 10,
        tasksCompleted: p.tasksCompleted,
        focusMinutes: p.focusMinutes,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Sleep</h1>
      <p className="mt-1 text-sm text-muted-foreground">Track it, don&apos;t just feel it.</p>

      <div className="mt-6">
        <SleepLogForm existing={existingToday} onSaved={handleSaved} />
      </div>

      <div className="mt-8 flex items-center justify-between">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Avg duration" value={formatDuration(avgDuration)} />
          <StatTile label="Avg quality" value={`${avgQuality} / 5`} />
        </div>
        <Tabs value={range} onValueChange={(v) => setRange(v as "7" | "30")}>
          <TabsList>
            <TabsTrigger value="7">7 days</TabsTrigger>
            <TabsTrigger value="30">30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-medium">Duration (hours)</h2>
        <LineStatChart data={durationSeries} valueFormatter={(v) => `${v}h`} domain={[0, 12]} />
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-medium">Quality</h2>
        <LineStatChart
          data={qualitySeries}
          color="var(--color-chart-2)"
          valueFormatter={(v) => `${v} / 5`}
          domain={[1, 5]}
        />
      </div>

      {correlation.length >= 3 && (
        <>
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-medium">Sleep vs. tasks completed</h2>
            <ScatterStatChart
              data={correlation.map((c) => ({ x: c.hours, y: c.tasksCompleted, date: c.date }))}
              xLabel="Hours slept"
              yLabel="Tasks done"
            />
          </div>
          <div className="mt-6 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-2 text-sm font-medium">Sleep vs. focused minutes</h2>
            <ScatterStatChart
              data={correlation.map((c) => ({ x: c.hours, y: c.focusMinutes, date: c.date }))}
              xLabel="Hours slept"
              yLabel="Focus min"
              color="var(--color-chart-3)"
            />
          </div>
        </>
      )}
    </div>
  );
}
