import { Request, Response, NextFunction } from "express";
import { ValidationChain } from "express-validator";
/**
 * validate – runs a chain of express-validator rules and forwards any
 * validation errors as a single ValidationError.
 */
export declare function validate(chains: ValidationChain[]): (req: Request, _res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=validate.d.ts.map