// All user-facing dates in Gotion are *local* calendar dates stored as
// "YYYY-MM-DD" strings. This is a single-user app, so "local" is pinned to
// one fixed timezone rather than the runtime's own — Vercel's servers run in
// UTC, which would otherwise make "today" flip over at the wrong moment
// (e.g. still evening in Nairobi but already tomorrow in UTC).
const TIMEZONE = process.env.NEXT_PUBLIC_TIMEZONE || "UTC";

const dateFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE });

export function toDateStr(d: Date): string {
  return dateFormatter.format(d);
}

export function todayStr(): string {
  return toDateStr(new Date());
}

/** Current hour (0-23) in the app's fixed timezone. */
export function currentHour(): number {
  const s = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).format(new Date());
  return Number(s) % 24;
}

export function parseDateStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * The UTC instant that is midnight at the *start* of dateStr in the app's
 * fixed timezone — for comparing a "YYYY-MM-DD" against a real DateTime
 * column (e.g. Task.completedAt) without drifting by the UTC offset.
 */
export function startOfDayUTC(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
    .formatToParts(guess)
    .reduce<Record<string, string>>((acc, p) => ((acc[p.type] = p.value), acc), {});

  const asUTC = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  const offsetMs = asUTC - guess.getTime();
  return new Date(guess.getTime() - offsetMs);
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
