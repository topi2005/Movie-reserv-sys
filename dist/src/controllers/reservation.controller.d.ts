import { Request, Response, NextFunction } from "express";
export declare class ReservationController {
    /** POST /reservations – reserve seats */
    reserve(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /** GET /reservations/me – my reservations */
    listMine(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /** DELETE /reservations/:id – cancel my reservation */
    cancel(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /** GET /admin/reservations – all reservations */
    listAll(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
    /** GET /admin/reports – capacity & revenue report */
    report(req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>>;
}
export declare const reservationController: ReservationController;
//# sourceMappingURL=reservation.controller.d.ts.map