import { Request, Response, NextFunction } from "express";
import path from "path";
import { movieService } from "../services/movie.service";
import { sendSuccess, sendPaginated } from "../utils/response";
import { Genre } from "@prisma/client";

export class MovieController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { genre, search, page, limit } = req.query as Record<string, string>;
      const result = await movieService.list({
        genre: genre as Genre | undefined,
        search,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });
      return sendPaginated(res, result.movies, result.total, result.page, result.limit);
    } catch (err) {
      return next(err);
    }
  }

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const movie = await movieService.getById(req.params.id);
      return sendSuccess(res, movie);
    } catch (err) {
      return next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const posterUrl = req.file
        ? `/uploads/${path.basename(req.file.path)}`
        : undefined;
      const movie = await movieService.create({ ...req.body, posterUrl });
      return sendSuccess(res, movie, 201);
    } catch (err) {
      return next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const posterUrl = req.file
        ? `/uploads/${path.basename(req.file.path)}`
        : undefined;
      const movie = await movieService.update(req.params.id, {
        ...req.body,
        ...(posterUrl ? { posterUrl } : {}),
      });
      return sendSuccess(res, movie);
    } catch (err) {
      return next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await movieService.delete(req.params.id);
      return sendSuccess(res, { message: "Movie deleted successfully" });
    } catch (err) {
      return next(err);
    }
  }
}

export const movieController = new MovieController();