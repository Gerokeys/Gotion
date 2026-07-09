"use server";

import { redirect } from "next/navigation";
import { clearAuthCookie, setAuthCookie } from "@/lib/auth";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const passcode = String(formData.get("passcode") ?? "");
  const next = String(formData.get("next") ?? "/");

  if (!passcode || passcode !== process.env.APP_PASSCODE) {
    return { error: "That's not it. Try again." };
  }

  await setAuthCookie();
  redirect(next.startsWith("/") ? next : "/");
}

export async function logoutAction() {
  await clearAuthCookie();
  redirect("/login");
}
