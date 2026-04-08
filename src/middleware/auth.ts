// src/middleware/auth.ts
import { Request, Response, NextFunction } from "express";
import { verifyToken, TokenPayload } from "../utils/jwt";
import { UnauthorizedError, ForbiddenError } from "../utils/errors";

// Extend Express Request to carry the decoded JWT payload
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

/**
 * authenticate – verifies the Bearer token in the Authorization header
 * and attaches the decoded payload to req.user.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(new UnauthorizedError("No token provided"));
  }

  const token = header.slice(7);
  try {
    req.user = verifyToken(token);
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * authorize – factory that creates a middleware checking that req.user
 * has one of the allowed roles.
 */
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError());
    }
    return next();
  };
}

/** Convenience aliases */
export const adminOnly = authorize("ADMIN");
export const userOrAdmin = authorize("USER", "ADMIN");