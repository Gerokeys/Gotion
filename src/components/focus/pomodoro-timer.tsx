"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logFocusSession } from "@/lib/actions/focus";

const FOCUS_MIN = 25;
const BREAK_MIN = 5;

type Mode = "focus" | "break";

// The countdown is driven by a fixed end timestamp rather than decrementing
// once per tick, so it stays correct even if the interval gets throttled or
// fully suspended while the screen is off — whenever it next runs (or the
// tab regains visibility), it recomputes from the real elapsed wall-clock
// time instead of however many ticks happened to fire.
export function PomodoroTimer({ onLogged }: { onLogged: (minutes: number) => void }) {
  const [mode, setMode] = useState<Mode>("focus");
  const [targetSeconds, setTargetSeconds] = useState(FOCUS_MIN * 60);
  const [remaining, setRemaining] = useState(FOCUS_MIN * 60);
  const [running, setRunning] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const modeRef = useRef(mode);
  const targetRef = useRef(targetSeconds);
  modeRef.current = mode;
  targetRef.current = targetSeconds;

  useEffect(() => {
    if (!running) return;

    function tick() {
      const endAt = endAtRef.current;
      if (endAt === null) return;
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) finishInterval(modeRef.current, targetRef.current);
    }

    tick();
    const interval = setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function finishInterval(finishedMode: Mode, target: number) {
    setRunning(false);
    endAtRef.current = null;
    if (finishedMode === "focus") {
      const minutes = Math.round(target / 60);
      logFocusSession(minutes, "focus");
      onLogged(minutes);
      toast.success(`Focus session logged — ${minutes} min`);
      switchMode("break");
    } else {
      toast("Break's over. Ready for another round?");
      switchMode("focus");
    }
  }

  function switchMode(next: Mode) {
    const secs = (next === "focus" ? FOCUS_MIN : BREAK_MIN) * 60;
    setMode(next);
    setTargetSeconds(secs);
    setRemaining(secs);
  }

  function toggleRunning() {
    if (running) {
      setRunning(false);
      endAtRef.current = null;
      return;
    }
    endAtRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  }

  function stopAndReset() {
    setRunning(false);
    endAtRef.current = null;
    if (mode === "focus") {
      const elapsed = targetSeconds - remaining;
      const minutes = Math.round(elapsed / 60);
      if (minutes >= 1) {
        logFocusSession(minutes, "focus");
        onLogged(minutes);
        toast.success(`Focus session logged — ${minutes} min`);
      }
    }
    setRemaining(targetSeconds);
  }

  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  const progress = 1 - remaining / targetSeconds;

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl border border-border bg-card p-10">
      <div className="flex gap-1 rounded-full bg-muted p-1 text-sm">
        <button
          onClick={() => !running && switchMode("focus")}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            mode === "focus" ? "bg-background shadow-sm" : "text-muted-foreground"
          )}
        >
          Focus
        </button>
        <button
          onClick={() => !running && switchMode("break")}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            mode === "break" ? "bg-background shadow-sm" : "text-muted-foreground"
          )}
        >
          Break
        </button>
      </div>

      <div className="relative flex size-56 items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-border)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={2 * Math.PI * 45 * (1 - progress)}
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span className="text-5xl font-semibold tabular-nums tracking-tight">
          {minutes}:{seconds}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <Button size="lg" onClick={toggleRunning} className="w-32">
          {running ? (
            <>
              <Pause className="size-4" /> Pause
            </>
          ) : (
            <>
              <Play className="size-4" /> Start
            </>
          )}
        </Button>
        <Button size="lg" variant="outline" onClick={stopAndReset} aria-label="Reset">
          <RotateCcw className="size-4" />
        </Button>
      </div>
    </div>
  );
}
