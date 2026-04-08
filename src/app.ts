// src/app.ts
import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";

import authRoutes from "./routes/auth.routes";
import movieRoutes from "./routes/movie.routes";
import showtimeRoutes from "./routes/showtime.routes";
import reservationRoutes from "./routes/reservation.routes";
import adminRoutes from "./routes/admin.routes";
import { errorHandler } from "./utils/errors";
import { NotFoundError } from "./utils/errors";

const app = express();

// ── Security & utility middleware ─────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow image serving
  })
);
app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Rate limiting ──────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" },
    },
  })
);

// ── Static uploads ─────────────────────────────────────────
app.use(
  "/uploads",
  express.static(path.resolve(process.env.UPLOAD_DIR ?? "uploads"))
);

// ── Health check ───────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/movies", movieRoutes);
app.use("/api/showtimes", showtimeRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/admin", adminRoutes);

// ── 404 ────────────────────────────────────────────────────
app.use((req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
});

// ── Global error handler ───────────────────────────────────
app.use(errorHandler);

export default app;