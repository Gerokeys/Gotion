"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListTodo,
  Kanban,
  Timer,
  Moon,
  Flame,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { PageTree } from "@/components/notes/page-tree";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/lib/actions/auth";

export type PageNode = {
  id: string;
  title: string;
  icon: string | null;
  parentId: string | null;
};

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Today", icon: ListTodo },
  { href: "/tasks/board", label: "Board", icon: Kanban },
  { href: "/focus", label: "Focus", icon: Timer },
  { href: "/sleep", label: "Sleep", icon: Moon },
  { href: "/habits", label: "Habits", icon: Flame },
  { href: "/quit", label: "Quit tracker", icon: ShieldCheck },
];

export function Sidebar({
  pages,
  onNavigate,
}: {
  pages: PageNode[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-4 pt-5 pb-2">
        <span className="text-sm font-semibold tracking-tight">Gotion</span>
      </div>

      <nav className="flex flex-col gap-0.5 px-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent font-medium text-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-4 flex-1 overflow-y-auto px-2">
        <PageTree pages={pages} onNavigate={onNavigate} />
      </div>

      <form action={logoutAction} className="border-t border-sidebar-border p-2">
        <button
          type="submit"
          className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <LogOut className="size-4" />
          Lock
        </button>
      </form>
    </div>
  );
}
