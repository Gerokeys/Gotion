"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight, FileText, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPage, deletePage, renamePage } from "@/lib/actions/pages";
import type { PageNode } from "@/components/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function buildTree(pages: PageNode[]) {
  const byParent = new Map<string | null, PageNode[]>();
  for (const p of pages) {
    const list = byParent.get(p.parentId) ?? [];
    list.push(p);
    byParent.set(p.parentId, list);
  }
  return byParent;
}

export function PageTree({
  pages,
  onNavigate,
}: {
  pages: PageNode[];
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const byParent = useMemo(() => buildTree(pages), [pages]);
  const roots = byParent.get(null) ?? [];

  async function handleNewPage(parentId: string | null) {
    const page = await createPage(parentId);
    router.push(`/notes/${page.id}`);
    onNavigate?.();
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between px-2.5 py-1">
        <span className="text-xs font-medium text-muted-foreground">Notes</span>
        <button
          onClick={() => handleNewPage(null)}
          className="rounded p-0.5 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
          aria-label="New page"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      {roots.length === 0 ? (
        <p className="px-2.5 py-1 text-xs text-muted-foreground">No pages yet.</p>
      ) : (
        roots.map((page) => (
          <PageTreeNode
            key={page.id}
            page={page}
            byParent={byParent}
            depth={0}
            onNavigate={onNavigate}
          />
        ))
      )}
    </div>
  );
}

function PageTreeNode({
  page,
  byParent,
  depth,
  onNavigate,
}: {
  page: PageNode;
  byParent: Map<string | null, PageNode[]>;
  depth: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [title, setTitle] = useState(page.title);
  const [, startTransition] = useTransition();

  const children = byParent.get(page.id) ?? [];
  const active = pathname === `/notes/${page.id}`;
  const hasChildren = children.length > 0;

  function commitRename() {
    setRenaming(false);
    const next = title.trim() || "Untitled";
    setTitle(next);
    if (next !== page.title) {
      startTransition(() => renamePage(page.id, next));
    }
  }

  async function handleNewSubpage() {
    const child = await createPage(page.id);
    router.push(`/notes/${child.id}`);
    onNavigate?.();
  }

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md pr-1 text-sm transition-colors",
          active
            ? "bg-sidebar-accent font-medium text-foreground"
            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "shrink-0 rounded p-0.5 hover:bg-sidebar-accent",
            !hasChildren && "invisible"
          )}
          tabIndex={hasChildren ? 0 : -1}
        >
          <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
        </button>

        <span className="shrink-0 text-sm leading-none">{page.icon ?? <FileText className="size-3.5" />}</span>

        {renaming ? (
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.currentTarget.blur();
              if (e.key === "Escape") {
                setTitle(page.title);
                setRenaming(false);
              }
            }}
            className="min-w-0 flex-1 bg-transparent py-1 outline-none"
          />
        ) : (
          <Link
            href={`/notes/${page.id}`}
            onClick={onNavigate}
            className="min-w-0 flex-1 truncate py-1"
          >
            {page.title}
          </Link>
        )}

        <button
          onClick={handleNewSubpage}
          className="hidden shrink-0 rounded p-0.5 hover:bg-sidebar-accent group-hover:block"
          aria-label="New subpage"
        >
          <Plus className="size-3.5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="hidden shrink-0 rounded p-0.5 hover:bg-sidebar-accent group-hover:block"
              aria-label="Page menu"
            >
              <MoreHorizontal className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setRenaming(true)}>Rename</DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                if (active) router.push("/notes");
                deletePage(page.id);
              }}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <PageTreeNode
              key={child.id}
              page={child}
              byParent={byParent}
              depth={depth + 1}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
