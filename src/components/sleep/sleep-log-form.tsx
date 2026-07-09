"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Moon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDuration, sleepDurationMin, todayStr } from "@/lib/dates";
import { upsertSleepLog } from "@/lib/actions/sleep";

export type SleepLogData = {
  date: string;
  bedtime: string;
  wakeTime: string;
  quality: number;
  notes: string | null;
};

const QUALITY_LABELS = ["Rough", "Meh", "Okay", "Good", "Great"];

export function SleepLogForm({
  existing,
  onSaved,
}: {
  existing: SleepLogData | null;
  onSaved: (log: SleepLogData) => void;
}) {
  const [date, setDate] = useState(existing?.date ?? todayStr());
  const [bedtime, setBedtime] = useState(existing?.bedtime ?? "23:00");
  const [wakeTime, setWakeTime] = useState(existing?.wakeTime ?? "07:00");
  const [quality, setQuality] = useState(existing?.quality ?? 3);
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [pending, startTransition] = useTransition();

  const duration = sleepDurationMin(bedtime, wakeTime);

  function submit() {
    startTransition(async () => {
      await upsertSleepLog({ date, bedtime, wakeTime, quality, notes: notes || undefined });
      onSaved({ date, bedtime, wakeTime, quality, notes: notes || null });
      toast.success("Sleep logged");
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Moon className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-medium">Log a night</h2>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="sleep-date" className="text-xs">
            Date
          </Label>
          <Input id="sleep-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bedtime" className="text-xs">
            Bedtime
          </Label>
          <Input id="bedtime" type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="waketime" className="text-xs">
            Wake time
          </Label>
          <Input
            id="waketime"
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Duration</Label>
          <div className="flex h-9 items-center text-sm text-muted-foreground">
            {formatDuration(duration)}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <Label className="text-xs">Quality</Label>
        <div className="flex gap-1.5">
          {QUALITY_LABELS.map((label, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                onClick={() => setQuality(value)}
                className={cn(
                  "flex-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
                  quality === value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:bg-accent"
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <Label htmlFor="sleep-notes" className="text-xs">
          Notes (optional)
        </Label>
        <Input
          id="sleep-notes"
          placeholder="Woke up a few times, felt restless…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <Button className="mt-4 w-full" onClick={submit} disabled={pending}>
        {pending ? "Saving…" : existing ? "Update" : "Save"}
      </Button>
    </div>
  );
}
