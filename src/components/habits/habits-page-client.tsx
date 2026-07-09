"use client";

import { useState } from "react";
import { HabitCard } from "@/components/habits/habit-card";
import { NewHabitForm } from "@/components/habits/new-habit-form";

type HabitData = { id: string; name: string; emoji: string | null; color: string | null; checkins: string[] };

export function HabitsPageClient({ initialHabits }: { initialHabits: HabitData[] }) {
  const [habits, setHabits] = useState(initialHabits);

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Habits</h1>
      <p className="mt-1 text-sm text-muted-foreground">Small, repeated, compounding.</p>

      <div className="mt-6">
        <NewHabitForm onCreated={(h) => setHabits((prev) => [...prev, h])} />
      </div>

      <div className="mt-6 flex flex-col gap-4">
        {habits.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No habits yet. Add one above to start your first streak.
          </p>
        ) : (
          habits.map((h) => (
            <HabitCard
              key={h.id}
              habit={h}
              onArchived={() => setHabits((prev) => prev.filter((x) => x.id !== h.id))}
            />
          ))
        )}
      </div>
    </div>
  );
}
