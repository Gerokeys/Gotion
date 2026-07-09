"use client";

import { useState } from "react";
import { StreakHero } from "@/components/quit/streak-hero";
import { DailyCheckin } from "@/components/quit/daily-checkin";
import { UrgePanicButton } from "@/components/quit/urge-panic-button";
import { TriggerAnalysis } from "@/components/quit/trigger-analysis";
import { QuitSettings } from "@/components/quit/quit-settings";

type Bucket = { label: string; value: number }[];
type Reason = { id: string; text: string };
type Action = { id: string; text: string; emoji: string | null };

export function QuitPageClient({
  initialCurrent,
  initialBest,
  initialCheckedInToday,
  reasons,
  actions,
  triggerData,
}: {
  initialCurrent: number;
  initialBest: number;
  initialCheckedInToday: boolean;
  reasons: Reason[];
  actions: Action[];
  triggerData: { byTrigger: Bucket; byMood: Bucket; byTimeOfDay: Bucket; byWeekday: Bucket };
}) {
  const [current, setCurrent] = useState(initialCurrent);
  const [best, setBest] = useState(initialBest);
  const [checkedInToday, setCheckedInToday] = useState(initialCheckedInToday);

  function handleRelapseLogged() {
    setBest((prev) => Math.max(prev, current));
    setCurrent(0);
    setCheckedInToday(true);
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Quit tracker</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Progress, not perfection. The data is here to help, not to judge.
      </p>

      <div className="mt-6">
        <StreakHero current={current} best={best} />
      </div>

      <div className="mt-4">
        <DailyCheckin
          checkedInToday={checkedInToday}
          onCleanCheckIn={() => setCheckedInToday(true)}
          onRelapseLogged={handleRelapseLogged}
        />
      </div>

      <div className="mt-4">
        <UrgePanicButton reasons={reasons} actions={actions} />
      </div>

      <h2 className="mt-10 mb-3 text-sm font-medium text-muted-foreground">Pattern analysis</h2>
      <TriggerAnalysis {...triggerData} />

      <h2 className="mt-10 mb-3 text-sm font-medium text-muted-foreground">Your toolkit</h2>
      <QuitSettings initialReasons={reasons} initialActions={actions} />
    </div>
  );
}
