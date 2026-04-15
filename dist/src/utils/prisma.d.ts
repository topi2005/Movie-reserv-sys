import { PrismaClient } from "@prisma/client";
declare global {
    var __prisma: PrismaClient | undefined;
}
/**
 * In development we keep a single PrismaClient instance across hot-reloads
 * to avoid exhausting the database connection pool.
 */
declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map