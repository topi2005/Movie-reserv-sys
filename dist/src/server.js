"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/server.ts
require("dotenv/config");
const app_1 = __importDefault(require("./app"));
const prisma_1 = __importDefault(require("./utils/prisma"));
const PORT = Number(process.env.PORT ?? 3000);
async function bootstrap() {
    // Verify database connection
    await prisma_1.default.$connect();
    console.log("✅  Database connected");
    const server = app_1.default.listen(PORT, () => {
        console.log(`🎬  Movie Reservation API running on http://localhost:${PORT}`);
        console.log(`📋  Environment: ${process.env.NODE_ENV ?? "development"}`);
    });
    // Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`\n${signal} received – shutting down gracefully…`);
        server.close(async () => {
            await prisma_1.default.$disconnect();
            console.log("✅  Database disconnected");
            process.exit(0);
        });
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
}
bootstrap().catch((err) => {
    console.error("❌  Failed to start server:", err);
    process.exit(1);
});
//# sourceMappingURL=server.js.map