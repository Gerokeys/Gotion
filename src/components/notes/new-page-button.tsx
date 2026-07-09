"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createPage } from "@/lib/actions/pages";

export function NewPageButton() {
  const router = useRouter();

  async function create() {
    const page = await createPage(null);
    router.push(`/notes/${page.id}`);
  }

  return <Button onClick={create}>New page</Button>;
}
