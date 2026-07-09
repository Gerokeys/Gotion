"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReflectionDialog } from "@/components/quit/reflection-dialog";
import { checkInDay } from "@/lib/actions/quit";
import { todayStr } from "@/lib/dates";

export function DailyCheckin({
  checkedInToday,
  onCleanCheckIn,
  onRelapseLogged,
}: {
  checkedInToday: boolean;
  onCleanCheckIn: () => void;
  onRelapseLogged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function markClean() {
    startTransition(async () => {
      await checkInDay("clean", todayStr());
      onCleanCheckIn();
      toast.success("Nice. Checked in for today.");
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        variant={checkedInToday ? "secondary" : "default"}
        className="flex-1"
        onClick={markClean}
        disabled={pending || checkedInToday}
      >
        {checkedInToday ? (
          <>
            <Check className="size-4" /> Checked in today
          </>
        ) : (
          "Clean day"
        )}
      </Button>
      <Button variant="outline" className="flex-1" onClick={() => setOpen(true)}>
        I had a relapse
      </Button>

      <ReflectionDialog open={open} onOpenChange={setOpen} onLogged={onRelapseLogged} />
    </div>
  );
}
