import { addDays, diffDays, todayStr } from "./dates";
import { MILESTONES } from "./types";

/**
 * Habit streak: consecutive checked days ending today — or ending yesterday
 * (today just isn't checked *yet*, the streak isn't broken until midnight).
 */
export function habitCurrentStreak(checkinDates: Set<string>): number {
  const today = todayStr();
  let cursor = checkinDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (checkinDates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function habitBestStreak(checkinDates: Set<string>): number {
  const sorted = [...checkinDates].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of sorted) {
    run = prev !== null && diffDays(prev, d) === 1 ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return best;
}

/**
 * Quit streaks, derived from relapse dates + the tracking start date.
 *
 * Convention (NoFap-style day counter):
 *  - a relapse today means streak 0; a relapse yesterday means today is Day 1
 *  - current = days since the most recent relapse (or since start + 1 if none)
 *  - best also considers historical gaps between relapses
 */
export function quitStreaks(relapseDates: string[], startDate: string) {
  const today = todayStr();
  const sorted = [...new Set(relapseDates)].sort();

  const current =
    sorted.length === 0
      ? Math.max(0, diffDays(startDate, today) + 1)
      : Math.max(0, diffDays(sorted[sorted.length - 1], today));

  let best = current;
  if (sorted.length > 0) {
    // clean days from start until the first relapse (relapse day excluded)
    best = Math.max(best, Math.max(0, diffDays(startDate, sorted[0])));
    for (let i = 1; i < sorted.length; i++) {
      best = Math.max(best, Math.max(0, diffDays(sorted[i - 1], sorted[i]) - 1));
    }
  }

  return { current, best };
}

export function nextMilestone(currentStreak: number): number | null {
  return MILESTONES.find((m) => m > currentStreak) ?? null;
}

export function lastReachedMilestone(currentStreak: number): number | null {
  const reached = MILESTONES.filter((m) => m <= currentStreak);
  return reached.length ? reached[reached.length - 1] : null;
}
