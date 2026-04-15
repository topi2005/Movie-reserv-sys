"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeatUnavailableError = exports.ValidationError = exports.ConflictError = exports.ForbiddenError = exports.UnauthorizedError = exports.NotFoundError = exports.AppError = void 0;
exports.errorHandler = errorHandler;
const library_1 = require("@prisma/client/runtime/library");
// ─────────────────────────────────────────────
// Custom error hierarchy
// ─────────────────────────────────────────────
class AppError extends Error {
    constructor(message, statusCode = 500, code) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        this.code = code;
        this.name = "AppError";
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppError = AppError;
class NotFoundError extends AppError {
    constructor(resource = "Resource") {
        super(`${resource} not found`, 404, "NOT_FOUND");
    }
}
exports.NotFoundError = NotFoundError;
class UnauthorizedError extends AppError {
    constructor(message = "Authentication required") {
        super(message, 401, "UNAUTHORIZED");
    }
}
exports.UnauthorizedError = UnauthorizedError;
class ForbiddenError extends AppError {
    constructor(message = "You do not have permission to perform this action") {
        super(message, 403, "FORBIDDEN");
    }
}
exports.ForbiddenError = ForbiddenError;
class ConflictError extends AppError {
    constructor(message = "Resource already exists") {
        super(message, 409, "CONFLICT");
    }
}
exports.ConflictError = ConflictError;
class ValidationError extends AppError {
    constructor(message) {
        super(message, 422, "VALIDATION_ERROR");
    }
}
exports.ValidationError = ValidationError;
class SeatUnavailableError extends AppError {
    constructor(seatLabel) {
        super(seatLabel
            ? `Seat ${seatLabel} is no longer available`
            : "One or more seats are no longer available", 409, "SEAT_UNAVAILABLE");
    }
}
exports.SeatUnavailableError = SeatUnavailableError;
// ─────────────────────────────────────────────
// Global error handler middleware
// ─────────────────────────────────────────────
function errorHandler(err, _req, res, 
// eslint-disable-next-line @typescript-eslint/no-unused-vars
_next) {
    // Known application errors
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: { code: err.code ?? "ERROR", message: err.message },
        });
    }
    // Prisma constraint violations
    if (err instanceof library_1.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            return res.status(409).json({
                success: false,
                error: { code: "CONFLICT", message: "A record with that value already exists" },
            });
        }
        if (err.code === "P2025") {
            return res.status(404).json({
                success: false,
                error: { code: "NOT_FOUND", message: "Record not found" },
            });
        }
    }
    // Unknown / unexpected errors
    console.error("[Unhandled Error]", err);
    return res.status(500).json({
        success: false,
        error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
    });
}
//# sourceMappingURL=errors.js.map