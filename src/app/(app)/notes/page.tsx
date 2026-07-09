import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";
import { NewPageButton } from "@/components/notes/new-page-button";

export const dynamic = "force-dynamic";

export default async function NotesIndexPage() {
  const first = await db.page.findFirst({
    where: { isInbox: false },
    orderBy: { position: "asc" },
  });

  if (first) redirect(`/notes/${first.id}`);

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
      <FileText className="size-10 text-muted-foreground" strokeWidth={1.5} />
      <div>
        <h1 className="text-lg font-medium">No pages yet</h1>
        <p className="text-sm text-muted-foreground">Create your first page to start writing.</p>
      </div>
      <NewPageButton />
    </div>
  );
}
