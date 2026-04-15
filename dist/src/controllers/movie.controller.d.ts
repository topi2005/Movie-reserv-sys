import { Request, Response, NextFunction } from "express";
export declare class MovieController {
    list(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    getOne(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    create(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    update(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    delete(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
}
export declare const movieController: MovieController;
//# sourceMappingURL=movie.controller.d.ts.map