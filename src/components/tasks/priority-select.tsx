"use client";

import { Flag } from "lucide-react";
import { PRIORITY_META, type Priority } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function PriorityDot({ priority }: { priority: Priority }) {
  return <Flag className={`size-3.5 ${PRIORITY_META[priority].className}`} fill="currentColor" />;
}

export function PrioritySelect({
  value,
  onChange,
}: {
  value: Priority;
  onChange: (p: Priority) => void;
}) {
  return (
    <Select value={String(value)} onValueChange={(v) => onChange(Number(v) as Priority)}>
      <SelectTrigger size="sm" className="w-28">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {([1, 2, 3, 4] as Priority[]).map((p) => (
          <SelectItem key={p} value={String(p)}>
            <span className="flex items-center gap-1.5">
              <PriorityDot priority={p} />
              {PRIORITY_META[p].label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
