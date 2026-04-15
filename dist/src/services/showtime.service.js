"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.showtimeService = exports.ShowtimeService = void 0;
// src/services/showtime.service.ts
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
const seed_1 = require("../../prisma/seed");
class ShowtimeService {
    /**
     * List showtimes, optionally filtered by date / movie / hall.
     * Returns showtimes with seat availability counts.
     */
    async list(query = {}) {
        const where = {};
        if (query.movieId)
            where.movieId = query.movieId;
        if (query.hallId)
            where.hallId = query.hallId;
        if (query.date) {
            const day = new Date(query.date);
            if (isNaN(day.getTime()))
                throw new errors_1.ValidationError("Invalid date format");
            const nextDay = new Date(day);
            nextDay.setDate(nextDay.getDate() + 1);
            where.startsAt = { gte: day, lt: nextDay };
        }
        else {
            // Default: only future showtimes
            where.startsAt = { gte: new Date() };
        }
        const showtimes = await prisma_1.default.showtime.findMany({
            where,
            orderBy: { startsAt: "asc" },
            include: {
                movie: {
                    select: { id: true, title: true, genre: true, durationMin: true, posterUrl: true },
                },
                hall: {
                    select: { id: true, name: true, rows: true, columns: true },
                },
                _count: {
                    select: {
                        seats: true,
                        reservations: { where: { status: "CONFIRMED" } },
                    },
                },
            },
        });
        return showtimes.map((s) => ({
            ...s,
            totalSeats: s._count.seats,
            reservedSeats: s._count.reservations,
            availableSeats: s._count.seats - s._count.reservations,
        }));
    }
    /** Get a single showtime with full seat map */
    async getById(id) {
        const showtime = await prisma_1.default.showtime.findUnique({
            where: { id },
            include: {
                movie: true,
                hall: true,
                seats: {
                    orderBy: [{ row: "asc" }, { column: "asc" }],
                    select: {
                        id: true,
                        row: true,
                        column: true,
                        label: true,
                        isReserved: true,
                    },
                },
            },
        });
        if (!showtime)
            throw new errors_1.NotFoundError("Showtime");
        return showtime;
    }
    /**
     * Create a showtime.
     * Validates:
     *  1. Movie and hall exist
     *  2. Hall has no overlapping showtime (accounts for movie duration + 15-min buffer)
     *  3. startsAt is in the future
     */
    async create(input) {
        const { movieId, hallId, startsAt, priceAmount, priceCurrency = "USD" } = input;
        if (new Date(startsAt) <= new Date()) {
            throw new errors_1.ValidationError("Showtime must be scheduled in the future");
        }
        const [movie, hall] = await Promise.all([
            prisma_1.default.movie.findUnique({ where: { id: movieId } }),
            prisma_1.default.hall.findUnique({ where: { id: hallId } }),
        ]);
        if (!movie)
            throw new errors_1.NotFoundError("Movie");
        if (!hall)
            throw new errors_1.NotFoundError("Hall");
        const endsAt = new Date(new Date(startsAt).getTime() + movie.durationMin * 60 * 1000);
        // Check for overlapping showtimes in the same hall
        // A showtime overlaps if it starts before our endsAt AND ends after our startsAt
        const bufferMs = 15 * 60 * 1000; // 15-minute cleanup buffer
        const overlap = await prisma_1.default.showtime.findFirst({
            where: {
                hallId,
                startsAt: { lt: new Date(endsAt.getTime() + bufferMs) },
                endsAt: { gt: new Date(new Date(startsAt).getTime() - bufferMs) },
            },
        });
        if (overlap) {
            throw new errors_1.ConflictError(`Hall "${hall.name}" already has a showtime that overlaps with this slot`);
        }
        const showtime = await prisma_1.default.showtime.create({
            data: { movieId, hallId, startsAt, endsAt, priceAmount, priceCurrency },
        });
        // Generate seats for this showtime in the same transaction-ish call
        await (0, seed_1.createSeatsForShowtime)(showtime.id, hall.rows, hall.columns);
        return this.getById(showtime.id);
    }
    /** Delete a showtime (admin only) - only if no confirmed reservations */
    async delete(id) {
        const showtime = await prisma_1.default.showtime.findUnique({
            where: { id },
            include: { _count: { select: { reservations: { where: { status: "CONFIRMED" } } } } },
        });
        if (!showtime)
            throw new errors_1.NotFoundError("Showtime");
        if (showtime._count.reservations > 0) {
            throw new errors_1.ConflictError("Cannot delete a showtime that has confirmed reservations");
        }
        await prisma_1.default.showtime.delete({ where: { id } });
    }
}
exports.ShowtimeService = ShowtimeService;
exports.showtimeService = new ShowtimeService();
//# sourceMappingURL=showtime.service.js.map