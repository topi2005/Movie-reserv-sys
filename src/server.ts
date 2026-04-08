// src/server.ts
import "dotenv/config";
import app from "./app";
import prisma from "./utils/prisma";

const PORT = Number(process.env.PORT ?? 3000);

async function bootstrap() {
  // Verify database connection
  await prisma.$connect();
  console.log("✅  Database connected");

  const server = app.listen(PORT, () => {
    console.log(`🎬  Movie Reservation API running on http://localhost:${PORT}`);
    console.log(`📋  Environment: ${process.env.NODE_ENV ?? "development"}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received – shutting down gracefully…`);
    server.close(async () => {
      await prisma.$disconnect();
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