// All user-facing dates in Gotion are *local* calendar dates stored as
// "YYYY-MM-DD" strings. This keeps sleep/habit check-ins pinned to the day
// the user experienced, independent of server timezone.

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(dateStr: string, n: number): string {
  const d = parseDateStr(dateStr);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** Whole days from a to b (positive when b is after a). */
export function diffDays(a: string, b: string): number {
  const ms = parseDateStr(b).getTime() - parseDateStr(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** Inclusive list of date strings from start to end. */
export function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

export function formatDate(dateStr: string, opts?: Intl.DateTimeFormatOptions): string {
  return parseDateStr(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...opts,
  });
}

/** Monday of the week containing dateStr. */
export function startOfWeekStr(dateStr: string): string {
  const d = parseDateStr(dateStr);
  const day = d.getDay(); // 0=Sun..6=Sat
  const diff = (day + 6) % 7; // days since Monday
  return addDays(dateStr, -diff);
}

export function weekdayShort(dateStr: string): string {
  return parseDateStr(dateStr).toLocaleDateString("en-US", { weekday: "short" });
}

/** "23:30" + "06:45" -> minutes asleep, handling the midnight crossing. */
export function sleepDurationMin(bedtime: string, wakeTime: string): number {
  const [bh, bm] = bedtime.split(":").map(Number);
  const [wh, wm] = wakeTime.split(":").map(Number);
  const bed = bh * 60 + bm;
  const wake = wh * 60 + wm;
  return wake > bed ? wake - bed : wake + 24 * 60 - bed;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** Relative label for a due date: Today, Tomorrow, Mon, Jun 3, or "3d overdue". */
export function dueLabel(dateStr: string): { label: string; overdue: boolean } {
  const today = todayStr();
  const d = diffDays(today, dateStr);
  if (d < 0) return { label: d === -1 ? "Yesterday" : `${-d}d overdue`, overdue: true };
  if (d === 0) return { label: "Today", overdue: false };
  if (d === 1) return { label: "Tomorrow", overdue: false };
  if (d < 7) return { label: weekdayShort(dateStr), overdue: false };
  return { label: formatDate(dateStr), overdue: false };
}
