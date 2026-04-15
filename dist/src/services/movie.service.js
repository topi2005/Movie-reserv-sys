"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.movieService = exports.MovieService = void 0;
// src/services/movie.service.ts
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
class MovieService {
    /** List movies with optional genre/search filter and pagination */
    async list(query = {}) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(50, Math.max(1, query.limit ?? 20));
        const skip = (page - 1) * limit;
        const where = {};
        if (query.genre)
            where.genre = query.genre;
        if (query.search) {
            where.title = { contains: query.search, mode: "insensitive" };
        }
        const [movies, total] = await Promise.all([
            prisma_1.default.movie.findMany({
                where,
                skip,
                take: limit,
                orderBy: { title: "asc" },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    genre: true,
                    durationMin: true,
                    posterUrl: true,
                    createdAt: true,
                    _count: { select: { showtimes: true } },
                },
            }),
            prisma_1.default.movie.count({ where }),
        ]);
        return { movies, total, page, limit };
    }
    /** Get a single movie with its upcoming showtimes */
    async getById(id) {
        const movie = await prisma_1.default.movie.findUnique({
            where: { id },
            include: {
                showtimes: {
                    where: { startsAt: { gte: new Date() } },
                    orderBy: { startsAt: "asc" },
                    include: {
                        hall: { select: { id: true, name: true, rows: true, columns: true } },
                        _count: {
                            select: {
                                seats: true,
                                reservations: {
                                    where: { status: "CONFIRMED" },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!movie)
            throw new errors_1.NotFoundError("Movie");
        return movie;
    }
    /** Create a new movie */
    async create(input) {
        return prisma_1.default.movie.create({
            data: input,
        });
    }
    /** Update movie details */
    async update(id, input) {
        await this.getById(id); // throws NotFoundError if missing
        return prisma_1.default.movie.update({ where: { id }, data: input });
    }
    /** Delete a movie and cascade-delete its showtimes & seats */
    async delete(id) {
        await this.getById(id);
        await prisma_1.default.movie.delete({ where: { id } });
    }
}
exports.MovieService = MovieService;
exports.movieService = new MovieService();
//# sourceMappingURL=movie.service.js.map