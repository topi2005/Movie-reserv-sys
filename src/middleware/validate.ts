// src/middleware/validate.ts
import { Request, Response, NextFunction } from "express";
import { validationResult, ValidationChain } from "express-validator";
import { ValidationError } from "../utils/errors";

/**
 * validate – runs a chain of express-validator rules and forwards any
 * validation errors as a single ValidationError.
 */
export function validate(chains: ValidationChain[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    // Run all chains in parallel
    await Promise.all(chains.map((chain) => chain.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    const messages = errors
      .array()
      .map((e) => e.msg)
      .join("; ");
    return next(new ValidationError(messages));
  };
}