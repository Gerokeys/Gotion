import { db } from "@/lib/db";
import { AppShell } from "@/components/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const pages = await db.page.findMany({
    where: { isInbox: false },
    orderBy: { position: "asc" },
    select: { id: true, title: true, icon: true, parentId: true },
  });

  return <AppShell pages={pages}>{children}</AppShell>;
}
