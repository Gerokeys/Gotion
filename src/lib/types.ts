// Central place for the string-union "enums" used across the app.
// Kept as strings in the DB so the schema works on SQLite and Postgres alike.

export const BLOCK_TYPES = ["text", "h1", "h2", "h3", "todo", "bullet", "toggle"] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

export type TaskStatus = "todo" | "doing" | "done";
export type Priority = 1 | 2 | 3 | 4;

export const PRIORITY_META: Record<Priority, { label: string; className: string }> = {
  1: { label: "P1", className: "text-red-400" },
  2: { label: "P2", className: "text-amber-400" },
  3: { label: "P3", className: "text-blue-400" },
  4: { label: "P4", className: "text-muted-foreground" },
};

// Quit tracker vocabularies — presets, but forms always allow free text.
export const TRIGGERS = [
  "stress",
  "boredom",
  "loneliness",
  "insomnia",
  "social media",
  "fatigue",
  "other",
] as const;

export const MOODS = [
  "anxious",
  "low",
  "numb",
  "restless",
  "fine",
  "other",
] as const;

export const TIMES_OF_DAY = [
  { label: "Morning", range: [5, 12] },
  { label: "Afternoon", range: [12, 17] },
  { label: "Evening", range: [17, 22] },
  { label: "Night", range: [22, 29] }, // 22:00–05:00, wraps past midnight
] as const;

export function timeOfDayLabel(hour: number): string {
  const h = hour < 5 ? hour + 24 : hour;
  const slot = TIMES_OF_DAY.find((t) => h >= t.range[0] && h < t.range[1]);
  return slot?.label ?? "Night";
}

export const MILESTONES = [7, 14, 30, 60, 90, 180, 365] as const;

export const MILESTONE_META: Record<number, { name: string; emoji: string }> = {
  7: { name: "One week", emoji: "🌱" },
  14: { name: "Two weeks", emoji: "🌿" },
  30: { name: "One month", emoji: "🌳" },
  60: { name: "Two months", emoji: "⛰️" },
  90: { name: "Ninety days", emoji: "🏔️" },
  180: { name: "Half a year", emoji: "🌅" },
  365: { name: "One year", emoji: "☀️" },
};

export const DEFAULT_REPLACEMENT_ACTIONS = [
  { text: "Go for a 10-minute walk", emoji: "🚶" },
  { text: "20 pushups, right now", emoji: "💪" },
  { text: "Cold shower", emoji: "🚿" },
  { text: "Step outside for fresh air", emoji: "🌬️" },
  { text: "Message a friend", emoji: "💬" },
  { text: "Drink a glass of water, breathe for 2 minutes", emoji: "🧘" },
];
