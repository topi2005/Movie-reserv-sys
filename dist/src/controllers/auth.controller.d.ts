import { Request, Response, NextFunction } from "express";
export declare class AuthController {
    register(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    login(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    getProfile(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    promoteUser(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
}
export declare const authController: AuthController;
//# sourceMappingURL=auth.controller.d.ts.map