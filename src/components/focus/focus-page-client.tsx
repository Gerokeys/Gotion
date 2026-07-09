"use client";

import { useState } from "react";
import { PomodoroTimer } from "@/components/focus/pomodoro-timer";
import { BarStatChart } from "@/components/charts/bar-stat-chart";
import { StatTile } from "@/components/ui/stat-tile";
import { formatDuration } from "@/lib/dates";

export function FocusPageClient({
  initialDaily,
}: {
  initialDaily: { label: string; value: number }[];
}) {
  const [daily, setDaily] = useState(initialDaily);

  function handleLogged(minutes: number) {
    setDaily((prev) => {
      const next = [...prev];
      next[next.length - 1] = {
        ...next[next.length - 1],
        value: next[next.length - 1].value + minutes,
      };
      return next;
    });
  }

  const todayMinutes = daily[daily.length - 1]?.value ?? 0;
  const weekMinutes = daily.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Focus</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Run a pomodoro. Every completed session gets logged automatically.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatTile label="Focused today" value={formatDuration(todayMinutes)} />
        <StatTile label="Focused this week" value={formatDuration(weekMinutes)} />
      </div>

      <div className="mt-6">
        <PomodoroTimer onLogged={handleLogged} />
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-4">
        <h2 className="mb-2 text-sm font-medium">Last 7 days</h2>
        <BarStatChart data={daily} valueFormatter={(v) => formatDuration(v)} />
      </div>
    </div>
  );
}
