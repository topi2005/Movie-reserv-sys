"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/utils/prisma.ts
const client_1 = require("@prisma/client");
/**
 * In development we keep a single PrismaClient instance across hot-reloads
 * to avoid exhausting the database connection pool.
 */
const prisma = global.__prisma ??
    new client_1.PrismaClient({
        log: process.env.NODE_ENV === "development"
            ? ["query", "warn", "error"]
            : ["warn", "error"],
    });
if (process.env.NODE_ENV !== "production")
    global.__prisma = prisma;
exports.default = prisma;
//# sourceMappingURL=prisma.js.map