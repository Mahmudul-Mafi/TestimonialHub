import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * In development, Next.js hot-reloads modules. Without a global guard, every
 * reload creates a new PrismaClient and exhausts the database connection
 * pool. Storing the instance on `globalThis` ensures we keep one client
 * across reloads in dev, while still creating a fresh one in production.
 *
 * Stage 3: this file is the only place that imports `@prisma/client`.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
