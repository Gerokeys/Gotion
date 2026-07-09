"use client";

import { useMemo, useState } from "react";
import { addDays, dateRange, formatDate, todayStr } from "@/lib/dates";
import { cn } from "@/lib/utils";

const WEEKS = 26;

export function HabitHeatmap({ checkedDates, color }: { checkedDates: Set<string>; color: string }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const today = todayStr();

  const weeks = useMemo(() => {
    // Align the grid so the last column ends on the current week's Saturday.
    const todayDow = new Date(today + "T00:00:00").getDay(); // 0=Sun
    const end = addDays(today, 6 - todayDow);
    const start = addDays(end, -(WEEKS * 7 - 1));
    const days = dateRange(start, end);

    const cols: string[][] = [];
    for (let i = 0; i < days.length; i += 7) cols.push(days.slice(i, i + 7));
    return cols;
  }, [today]);

  return (
    <div className="overflow-x-auto">
      <div className="inline-flex gap-[3px]">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-[3px]">
            {week.map((date) => {
              const checked = checkedDates.has(date);
              const future = date > today;
              return (
                <div
                  key={date}
                  onMouseEnter={() => setHovered(date)}
                  onMouseLeave={() => setHovered(null)}
                  className={cn(
                    "size-[11px] rounded-[2px] transition-transform",
                    future ? "invisible" : "bg-muted",
                    hovered === date && "ring-1 ring-foreground/40"
                  )}
                  style={checked ? { backgroundColor: color } : undefined}
                  title={`${formatDate(date, { year: "numeric" })}${checked ? " — done" : ""}`}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
