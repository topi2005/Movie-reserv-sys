import { Request, Response, NextFunction } from "express";
import { TokenPayload } from "../utils/jwt";
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
export declare function authenticate(req: Request, _res: Response, next: NextFunction): void;
/**
 * authorize – factory that creates a middleware checking that req.user
 * has one of the allowed roles.
 */
export declare function authorize(...roles: string[]): (req: Request, _res: Response, next: NextFunction) => void;
/** Convenience aliases */
export declare const adminOnly: (req: Request, _res: Response, next: NextFunction) => void;
export declare const userOrAdmin: (req: Request, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map