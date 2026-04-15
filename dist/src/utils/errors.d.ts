import { Request, Response, NextFunction } from "express";
export declare class AppError extends Error {
    message: string;
    statusCode: number;
    code?: string | undefined;
    constructor(message: string, statusCode?: number, code?: string | undefined);
}
export declare class NotFoundError extends AppError {
    constructor(resource?: string);
}
export declare class UnauthorizedError extends AppError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AppError {
    constructor(message?: string);
}
export declare class ConflictError extends AppError {
    constructor(message?: string);
}
export declare class ValidationError extends AppError {
    constructor(message: string);
}
export declare class SeatUnavailableError extends AppError {
    constructor(seatLabel?: string);
}
export declare function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): Response<any, Record<string, any>>;
//# sourceMappingURL=errors.d.ts.map