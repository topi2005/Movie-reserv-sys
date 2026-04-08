// src/utils/errors.ts
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

// ─────────────────────────────────────────────
// Custom error hierarchy
// ─────────────────────────────────────────────

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 422, "VALIDATION_ERROR");
  }
}

export class SeatUnavailableError extends AppError {
  constructor(seatLabel?: string) {
    super(
      seatLabel
        ? `Seat ${seatLabel} is no longer available`
        : "One or more seats are no longer available",
      409,
      "SEAT_UNAVAILABLE"
    );
  }
}

// ─────────────────────────────────────────────
// Global error handler middleware
// ─────────────────────────────────────────────

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) {
  // Known application errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code ?? "ERROR", message: err.message },
    });
  }

  // Prisma constraint violations
  if (err instanceof PrismaClientKnownRequestError) {
    if ((err as PrismaClientKnownRequestError).code === "P2002") {
      return res.status(409).json({
        success: false,
        error: { code: "CONFLICT", message: "A record with that value already exists" },
      });
    }
    if ((err as PrismaClientKnownRequestError).code === "P2025") {
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