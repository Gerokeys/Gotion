"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Shuffle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { logUrge, resolveUrge } from "@/lib/actions/quit";

type Reason = { id: string; text: string };
type Action = { id: string; text: string; emoji: string | null };

export function UrgePanicButton({ reasons, actions }: { reasons: Reason[]; actions: Action[] }) {
  const [open, setOpen] = useState(false);
  const [urgeId, setUrgeId] = useState<string | null>(null);
  const [actionIndex, setActionIndex] = useState(0);
  const [pending, startTransition] = useTransition();

  function pressPanic() {
    startTransition(async () => {
      const urge = await logUrge();
      setUrgeId(urge.id);
      setActionIndex(Math.floor(Math.random() * Math.max(actions.length, 1)));
      setOpen(true);
    });
  }

  function resolve(outcome: "passed" | "relapsed") {
    if (!urgeId) return;
    const action = actions[actionIndex]?.text;
    startTransition(async () => {
      await resolveUrge(urgeId, outcome, outcome === "passed" ? action : undefined);
      setOpen(false);
      setUrgeId(null);
      if (outcome === "passed") toast.success("You rode it out. That's the whole game.");
    });
  }

  const suggestion = actions[actionIndex];

  return (
    <>
      <Button
        size="lg"
        variant="destructive"
        className="w-full gap-2"
        onClick={pressPanic}
        disabled={pending}
      >
        <Zap className="size-4" />
        Feeling an urge? Tap here
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>This feeling will pass.</DialogTitle>
          </DialogHeader>

          {reasons.length > 0 && (
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Why you started this
              </p>
              <ul className="flex flex-col gap-1 text-sm">
                {reasons.map((r) => (
                  <li key={r.id}>• {r.text}</li>
                ))}
              </ul>
            </div>
          )}

          {suggestion && (
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <span className="text-sm">
                Try: <span className="font-medium">{suggestion.emoji} {suggestion.text}</span>
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setActionIndex((i) => (i + 1) % actions.length)}
                aria-label="Suggest another action"
              >
                <Shuffle className="size-4" />
              </Button>
            </div>
          )}

          <div className="mt-2 flex gap-3">
            <Button className="flex-1" onClick={() => resolve("passed")} disabled={pending}>
              I&apos;m okay — it passed
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => resolve("relapsed")}
              disabled={pending}
            >
              I relapsed
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
