// src/controllers/showtime.controller.ts
import { Request, Response, NextFunction } from "express";
import { showtimeService } from "../services/showtime.service";
import { sendSuccess } from "../utils/response";

export class ShowtimeController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { date, movieId, hallId } = req.query as Record<string, string>;
      const showtimes = await showtimeService.list({ date, movieId, hallId });
      return sendSuccess(res, showtimes);
    } catch (err) {
      return next(err);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const showtime = await showtimeService.getById(req.params.id);
      return sendSuccess(res, showtime);
    } catch (err) {
      return next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const showtime = await showtimeService.create({
        ...req.body,
        startsAt: new Date(req.body.startsAt),
        priceAmount: Number(req.body.priceAmount),
      });
      return sendSuccess(res, showtime, 201);
    } catch (err) {
      return next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await showtimeService.delete(req.params.id);
      return sendSuccess(res, { message: "Showtime deleted successfully" });
    } catch (err) {
      return next(err);
    }
  }
}

export const showtimeController = new ShowtimeController();