"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.movieController = exports.MovieController = void 0;
const path_1 = __importDefault(require("path"));
const movie_service_1 = require("../services/movie.service");
const response_1 = require("../utils/response");
class MovieController {
    async list(req, res, next) {
        try {
            const { genre, search, page, limit } = req.query;
            const result = await movie_service_1.movieService.list({
                genre: genre,
                search,
                page: page ? Number(page) : undefined,
                limit: limit ? Number(limit) : undefined,
            });
            return (0, response_1.sendPaginated)(res, result.movies, result.total, result.page, result.limit);
        }
        catch (err) {
            return next(err);
        }
    }
    async getOne(req, res, next) {
        try {
            const movie = await movie_service_1.movieService.getById(req.params.id);
            return (0, response_1.sendSuccess)(res, movie);
        }
        catch (err) {
            return next(err);
        }
    }
    async create(req, res, next) {
        try {
            const posterUrl = req.file
                ? `/uploads/${path_1.default.basename(req.file.path)}`
                : undefined;
            const movie = await movie_service_1.movieService.create({ ...req.body, posterUrl });
            return (0, response_1.sendSuccess)(res, movie, 201);
        }
        catch (err) {
            return next(err);
        }
    }
    async update(req, res, next) {
        try {
            const posterUrl = req.file
                ? `/uploads/${path_1.default.basename(req.file.path)}`
                : undefined;
            const movie = await movie_service_1.movieService.update(req.params.id, {
                ...req.body,
                ...(posterUrl ? { posterUrl } : {}),
            });
            return (0, response_1.sendSuccess)(res, movie);
        }
        catch (err) {
            return next(err);
        }
    }
    async delete(req, res, next) {
        try {
            await movie_service_1.movieService.delete(req.params.id);
            return (0, response_1.sendSuccess)(res, { message: "Movie deleted successfully" });
        }
        catch (err) {
            return next(err);
        }
    }
}
exports.MovieController = MovieController;
exports.movieController = new MovieController();
//# sourceMappingURL=movie.controller.js.map