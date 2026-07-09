import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { PageEditor } from "@/components/notes/page-editor";

export default async function NotePage({
  params,
}: {
  params: Promise<{ pageId: string }>;
}) {
  const { pageId } = await params;

  const page = await db.page.findUnique({
    where: { id: pageId },
    include: { blocks: { orderBy: { position: "asc" } } },
  });

  if (!page) notFound();

  if (page.blocks.length === 0) {
    const first = await db.block.create({ data: { pageId, type: "text", content: "" } });
    page.blocks = [first];
  }

  return <PageEditor page={page} />;
}
