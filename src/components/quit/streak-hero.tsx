"use client";

import { cn } from "@/lib/utils";
import { MILESTONES, MILESTONE_META } from "@/lib/types";
import { lastReachedMilestone, nextMilestone } from "@/lib/streaks";

export function StreakHero({ current, best }: { current: number; best: number }) {
  const next = nextMilestone(current);
  const lastReached = lastReachedMilestone(current);
  const milestones: readonly number[] = MILESTONES;
  const prevMilestone = next
    ? (milestones[milestones.indexOf(next) - 1] ?? 0)
    : milestones[milestones.length - 1];
  const progress = next ? ((current - prevMilestone) / (next - prevMilestone)) * 100 : 100;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 text-center sm:p-8">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Current streak
      </p>
      <p className="mt-2 text-6xl font-bold tracking-tight tabular-nums">{current}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        day{current === 1 ? "" : "s"}
        {best > current && <> · best streak {best}</>}
      </p>

      {next && (
        <div className="mx-auto mt-6 max-w-xs">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min(100, Math.max(2, progress))}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {next - current} day{next - current === 1 ? "" : "s"} to {MILESTONE_META[next].name}{" "}
            {MILESTONE_META[next].emoji}
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {MILESTONES.map((m) => {
          const reached = current >= m;
          return (
            <div
              key={m}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
                reached
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground/60"
              )}
              title={MILESTONE_META[m].name}
            >
              <span>{MILESTONE_META[m].emoji}</span>
              <span>{m}d</span>
            </div>
          );
        })}
      </div>
      {lastReached && (
        <p className="mt-3 text-xs text-muted-foreground">
          You&apos;ve already reached {MILESTONE_META[lastReached].name.toLowerCase()}. That&apos;s real.
        </p>
      )}
    </div>
  );
}
