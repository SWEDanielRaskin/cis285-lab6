import { PrismaClient } from "@prisma/client";

// One PrismaClient per server process. In development, Next.js hot reload
// re-evaluates modules, so the client is cached on globalThis to avoid
// opening a new SQLite connection on every edit.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
