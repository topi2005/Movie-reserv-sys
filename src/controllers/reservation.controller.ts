// src/controllers/reservation.controller.ts
import { Request, Response, NextFunction } from "express";
import { reservationService } from "../services/reservation.service";
import { sendSuccess, sendPaginated } from "../utils/response";

export class ReservationController {
  /** POST /reservations – reserve seats */
  async reserve(req: Request, res: Response, next: NextFunction) {
    try {
      const reservations = await reservationService.reserve({
        userId: req.user!.sub,
        showtimeId: req.body.showtimeId,
        seatIds: req.body.seatIds,
      });
      return sendSuccess(res, reservations, 201);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /reservations/me – my reservations */
  async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status } = req.query as Record<string, string>;
      const result = await reservationService.listMyReservations(req.user!.sub, {
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as any,
      });
      return sendPaginated(res, result.reservations, result.total, result.page, result.limit);
    } catch (err) {
      return next(err);
    }
  }

  /** DELETE /reservations/:id – cancel my reservation */
  async cancel(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await reservationService.cancel(
        req.params.id,
        req.user!.sub
      );
      return sendSuccess(res, result);
    } catch (err) {
      return next(err);
    }
  }

  // ── Admin ──────────────────────────────────────────────

  /** GET /admin/reservations – all reservations */
  async listAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, status, showtimeId } = req.query as Record<string, string>;
      const result = await reservationService.listAll({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as any,
        showtimeId,
      });
      return sendPaginated(res, result.reservations, result.total, result.page, result.limit);
    } catch (err) {
      return next(err);
    }
  }

  /** GET /admin/reports – capacity & revenue report */
  async report(req: Request, res: Response, next: NextFunction) {
    try {
      const { fromDate, toDate, movieId } = req.query as Record<string, string>;
      const data = await reservationService.report({ fromDate, toDate, movieId });
      return sendSuccess(res, data);
    } catch (err) {
      return next(err);
    }
  }
}

export const reservationController = new ReservationController();