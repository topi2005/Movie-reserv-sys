"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/app.ts
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const movie_routes_1 = __importDefault(require("./routes/movie.routes"));
const showtime_routes_1 = __importDefault(require("./routes/showtime.routes"));
const reservation_routes_1 = __importDefault(require("./routes/reservation.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
const errors_1 = require("./utils/errors");
const errors_2 = require("./utils/errors");
const app = (0, express_1.default)();
// ── Security & utility middleware ─────────────────────────
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow image serving
}));
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN ?? "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use((0, morgan_1.default)(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// ── Rate limiting ──────────────────────────────────────────
app.use((0, express_rate_limit_1.default)({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000),
    max: Number(process.env.RATE_LIMIT_MAX ?? 100),
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: { code: "RATE_LIMITED", message: "Too many requests, please try again later" },
    },
}));
// ── Static uploads ─────────────────────────────────────────
app.use("/uploads", express_1.default.static(path_1.default.resolve(process.env.UPLOAD_DIR ?? "uploads")));
// ── Health check ───────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
// ── API Routes ─────────────────────────────────────────────
app.use("/api/auth", auth_routes_1.default);
app.use("/api/movies", movie_routes_1.default);
app.use("/api/showtimes", showtime_routes_1.default);
app.use("/api/reservations", reservation_routes_1.default);
app.use("/api/admin", admin_routes_1.default);
// ── 404 ────────────────────────────────────────────────────
app.use((req, _res, next) => {
    next(new errors_2.NotFoundError(`Route ${req.method} ${req.path}`));
});
// ── Global error handler ───────────────────────────────────
app.use(errors_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map