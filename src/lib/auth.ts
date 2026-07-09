// Uses Web Crypto (not Node's `crypto` module) so the same code runs in both
// the Edge middleware runtime and normal server actions/route handlers.
import { cookies } from "next/headers";

export const AUTH_COOKIE = "gotion_auth";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 365; // 1 year — personal app, not a shared login

let keyPromise: Promise<CryptoKey> | null = null;

function getKey(): Promise<CryptoKey> {
  if (!keyPromise) {
    const secret = process.env.AUTH_SECRET;
    if (!secret) throw new Error("AUTH_SECRET is not set");
    keyPromise = crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }
  return keyPromise;
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function sign(value: string): Promise<string> {
  const key = await getKey();
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return toHex(mac);
}

export async function makeAuthToken(): Promise<string> {
  const payload = String(Date.now());
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAuthToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return false;
  const expected = await sign(payload);
  if (mac.length !== expected.length) return false;
  // constant-time-ish compare; timing leaks on a locally-run single-user app aren't a real threat model
  let diff = 0;
  for (let i = 0; i < mac.length; i++) diff |= mac.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return verifyAuthToken(store.get(AUTH_COOKIE)?.value);
}

export async function setAuthCookie() {
  const store = await cookies();
  store.set(AUTH_COOKIE, await makeAuthToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
}

export async function clearAuthCookie() {
  const store = await cookies();
  store.delete(AUTH_COOKIE);
}
