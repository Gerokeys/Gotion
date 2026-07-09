"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { createHabit } from "@/lib/actions/habits";

const EMOJI_CHOICES = ["💪", "📖", "🧘", "🥗", "💧", "🏃", "🎨", "🎸", "🛏️", "🚭", "🧹", "☀️"];

export function NewHabitForm({
  onCreated,
}: {
  onCreated: (habit: { id: string; name: string; emoji: string | null; color: string | null; checkins: string[] }) => void;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const value = name.trim();
    if (!value) return;
    startTransition(async () => {
      const habit = await createHabit(value, emoji ?? undefined);
      onCreated({ id: habit.id, name: habit.name, emoji: habit.emoji, color: habit.color, checkins: [] });
      setName("");
      setEmoji(null);
    });
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-2">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex size-8 shrink-0 items-center justify-center rounded-md text-lg hover:bg-accent">
            {emoji ?? <Plus className="size-4 text-muted-foreground" />}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <div className="grid grid-cols-6 gap-1">
            {EMOJI_CHOICES.map((e) => (
              <button key={e} onClick={() => setEmoji(e)} className="rounded p-1.5 text-xl hover:bg-accent">
                {e}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Input
        placeholder="New habit… (e.g. Read 10 pages)"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        className="h-8 border-none px-0 shadow-none focus-visible:ring-0"
      />
      <Button size="sm" onClick={submit} disabled={pending || !name.trim()}>
        Add
      </Button>
    </div>
  );
}
