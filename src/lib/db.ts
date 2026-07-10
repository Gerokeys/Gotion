import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient() {
  // Locally this is a "file:./prisma/dev.db" URL with no auth token needed.
  // In production it's a remote Turso "libsql://…" URL, which does need one.
  const adapter = new PrismaLibSql({
    url: process.env.DATABASE_URL!,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  return new PrismaClient({ adapter });
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
