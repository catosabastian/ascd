import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { _prisma: PrismaClient | undefined };

/**
 * Returns a lazily-initialized PrismaClient singleton.
 * The PrismaClient is NOT created until this function is first called,
 * which happens only at runtime — never during the build.
 */
export function getPrisma(): PrismaClient {
  if (!globalForPrisma._prisma) {
    globalForPrisma._prisma = new PrismaClient({ log: ["error"] });
  }
  return globalForPrisma._prisma;
}
