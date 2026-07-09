"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  addReason,
  addReplacementAction,
  deleteReason,
  deleteReplacementAction,
} from "@/lib/actions/quit";

type Reason = { id: string; text: string };
type Action = { id: string; text: string; emoji: string | null };

export function QuitSettings({
  initialReasons,
  initialActions,
}: {
  initialReasons: Reason[];
  initialActions: Action[];
}) {
  const [reasons, setReasons] = useState(initialReasons);
  const [actions, setActions] = useState(initialActions);
  const [reasonInput, setReasonInput] = useState("");
  const [actionInput, setActionInput] = useState("");
  const [, startTransition] = useTransition();

  function submitReason() {
    const text = reasonInput.trim();
    if (!text) return;
    setReasonInput("");
    startTransition(async () => {
      const r = await addReason(text);
      setReasons((prev) => [...prev, { id: r.id, text: r.text }]);
    });
  }

  function submitAction() {
    const text = actionInput.trim();
    if (!text) return;
    setActionInput("");
    startTransition(async () => {
      const a = await addReplacementAction(text);
      setActions((prev) => [...prev, { id: a.id, text: a.text, emoji: a.emoji }]);
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium">Your reasons</h3>
        <ul className="mb-2 flex flex-col gap-1.5">
          {reasons.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{r.text}</span>
              <button
                onClick={() => {
                  setReasons((prev) => prev.filter((x) => x.id !== r.id));
                  deleteReason(r.id);
                }}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove reason"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitReason()}
            placeholder="Add a reason…"
            className="h-8"
          />
          <Button size="icon" variant="outline" className="size-8 shrink-0" onClick={submitReason}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium">Replacement actions</h3>
        <ul className="mb-2 flex flex-col gap-1.5">
          {actions.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {a.emoji} {a.text}
              </span>
              <button
                onClick={() => {
                  setActions((prev) => prev.filter((x) => x.id !== a.id));
                  deleteReplacementAction(a.id);
                }}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove action"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAction()}
            placeholder="Add an action…"
            className="h-8"
          />
          <Button size="icon" variant="outline" className="size-8 shrink-0" onClick={submitAction}>
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
