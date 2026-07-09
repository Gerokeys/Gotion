"use client";

import { useMemo, useState } from "react";
import { Check, MoreHorizontal } from "lucide-react";
import { HabitHeatmap } from "@/components/habits/habit-heatmap";
import { habitBestStreak, habitCurrentStreak } from "@/lib/streaks";
import { todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { archiveHabit, toggleHabitCheckin } from "@/lib/actions/habits";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const HABIT_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

export function HabitCard({
  habit,
  onArchived,
}: {
  habit: { id: string; name: string; emoji: string | null; color: string | null; checkins: string[] };
  onArchived: () => void;
}) {
  const [checkedDates, setCheckedDates] = useState(new Set(habit.checkins));
  const today = todayStr();
  const checkedToday = checkedDates.has(today);
  const color = habit.color ?? HABIT_COLORS[hashIndex(habit.id, HABIT_COLORS.length)];

  const current = useMemo(() => habitCurrentStreak(checkedDates), [checkedDates]);
  const best = useMemo(() => habitBestStreak(checkedDates), [checkedDates]);

  function toggle() {
    const next = !checkedToday;
    setCheckedDates((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(today);
      else copy.delete(today);
      return copy;
    });
    toggleHabitCheckin(habit.id, today, next);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={toggle}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-lg transition-colors",
              checkedToday ? "border-transparent text-primary-foreground" : "border-border text-transparent"
            )}
            style={checkedToday ? { backgroundColor: color } : undefined}
            aria-label={checkedToday ? "Checked in today" : "Check in today"}
          >
            {checkedToday ? <Check className="size-4" /> : (habit.emoji ?? "")}
          </button>
          <div>
            <p className="font-medium">{habit.name}</p>
            <p className="text-xs text-muted-foreground">
              {current > 0 ? `${current} day${current === 1 ? "" : "s"} streak` : "No active streak"}
              {best > 0 && ` · best ${best}`}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded p-1 text-muted-foreground hover:bg-accent" aria-label="Habit menu">
              <MoreHorizontal className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                archiveHabit(habit.id);
                onArchived();
              }}
            >
              Archive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-4">
        <HabitHeatmap checkedDates={checkedDates} color={color} />
      </div>
    </div>
  );
}

function hashIndex(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % mod;
}
