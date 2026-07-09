"use client";

import { useState, useTransition } from "react";
import { renamePage, setPageIcon, deletePage } from "@/lib/actions/pages";
import { BlockEditor, type ClientBlock } from "@/components/notes/block-editor";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const EMOJI_CHOICES = ["📄", "📝", "💡", "✅", "📌", "🎯", "📚", "🗓️", "⭐", "🔥", "🌱", "🧠"];

type PageData = {
  id: string;
  title: string;
  icon: string | null;
  blocks: ClientBlock[];
};

export function PageEditor({ page }: { page: PageData }) {
  const [title, setTitle] = useState(page.title);
  const [icon, setIcon] = useState(page.icon);
  const [, startTransition] = useTransition();

  function commitTitle() {
    const next = title.trim() || "Untitled";
    setTitle(next);
    if (next !== page.title) startTransition(() => renamePage(page.id, next));
  }

  function pickIcon(emoji: string | null) {
    setIcon(emoji);
    startTransition(() => setPageIcon(page.id, emoji));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-10">
      <div className="mb-2 flex items-start gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className="rounded-md p-1 text-4xl leading-none transition-colors hover:bg-accent">
              {icon ?? "📄"}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            <div className="grid grid-cols-6 gap-1">
              {EMOJI_CHOICES.map((e) => (
                <button
                  key={e}
                  onClick={() => pickIcon(e)}
                  className="rounded p-1.5 text-xl hover:bg-accent"
                >
                  {e}
                </button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-muted-foreground"
              onClick={() => pickIcon(null)}
            >
              Remove icon
            </Button>
          </PopoverContent>
        </Popover>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          placeholder="Untitled"
          className="mt-2 flex-1 bg-transparent text-3xl font-bold tracking-tight outline-none placeholder:text-muted-foreground/50"
        />

        <Button
          variant="ghost"
          size="icon"
          className="mt-2 text-muted-foreground hover:text-destructive"
          onClick={() => deletePage(page.id)}
          aria-label="Delete page"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <BlockEditor pageId={page.id} initialBlocks={page.blocks} />
    </div>
  );
}
