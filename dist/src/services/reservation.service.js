"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reservationService = exports.ReservationService = void 0;
// src/services/reservation.service.ts
const prisma_1 = __importDefault(require("../utils/prisma"));
const errors_1 = require("../utils/errors");
class ReservationService {
    /**
     * Reserve one or more seats for a showtime.
     *
     * Race-condition safety strategy:
     *  - We use a Prisma interactive transaction.
     *  - Inside the transaction we re-read each seat with a FOR UPDATE lock
     *    (via `$queryRaw` on PostgreSQL) and verify isReserved === false.
     *  - If any seat is already reserved, we abort the transaction and throw.
     *  - This prevents double-booking even under concurrent requests.
     */
    async reserve(input) {
        const { userId, showtimeId, seatIds } = input;
        if (!seatIds.length)
            throw new errors_1.ValidationError("Select at least one seat");
        if (seatIds.length > 10)
            throw new errors_1.ValidationError("Cannot reserve more than 10 seats at once");
        // Basic pre-checks outside the transaction
        const showtime = await prisma_1.default.showtime.findUnique({ where: { id: showtimeId } });
        if (!showtime)
            throw new errors_1.NotFoundError("Showtime");
        if (showtime.startsAt <= new Date()) {
            throw new errors_1.ValidationError("Cannot reserve seats for a past or ongoing showtime");
        }
        // Check the user doesn't already have a reservation for this showtime
        const existingReservation = await prisma_1.default.reservation.findFirst({
            where: { userId, showtimeId, status: "CONFIRMED" },
        });
        if (existingReservation) {
            throw new errors_1.ConflictError("You already have a reservation for this showtime");
        }
        // ── Atomic reservation inside a transaction ───────────────
        const reservations = await prisma_1.default.$transaction(async (tx) => {
            // Lock and read seats
            // Using raw SQL for row-level locking on PostgreSQL.
            // For SQLite (dev), we use a simpler optimistic approach.
            const isPostgres = process.env.DATABASE_URL?.startsWith("postgresql");
            let seats;
            if (isPostgres) {
                seats = await tx.$queryRaw `
          SELECT id, label, is_reserved, showtime_id
          FROM seats
          WHERE id = ANY(${seatIds}::text[])
          FOR UPDATE
        `;
            }
            else {
                seats = await tx.seat.findMany({ where: { id: { in: seatIds } } });
            }
            // Validate seat ownership and availability
            for (const seat of seats) {
                const isReserved = isPostgres
                    ? seat.is_reserved
                    : seat.isReserved;
                const seatShowtimeId = isPostgres
                    ? seat.showtime_id
                    : seat.showtimeId;
                if (seatShowtimeId !== showtimeId) {
                    throw new errors_1.ValidationError(`Seat ${seat.label} does not belong to this showtime`);
                }
                if (isReserved) {
                    throw new errors_1.SeatUnavailableError(seat.label);
                }
            }
            if (seats.length !== seatIds.length) {
                throw new errors_1.NotFoundError("One or more seats");
            }
            // Mark seats as reserved
            await tx.seat.updateMany({
                where: { id: { in: seatIds } },
                data: { isReserved: true },
            });
            // Create reservation records
            const created = await Promise.all(seatIds.map((seatId) => tx.reservation.create({
                data: {
                    userId,
                    showtimeId,
                    seatId,
                    amountPaid: showtime.priceAmount,
                    currency: showtime.priceCurrency,
                    status: "CONFIRMED",
                },
                include: {
                    seat: { select: { label: true, row: true, column: true } },
                    showtime: {
                        include: {
                            movie: { select: { title: true } },
                            hall: { select: { name: true } },
                        },
                    },
                },
            })));
            return created;
        });
        return reservations;
    }
    /** Get reservations for the current user */
    async listMyReservations(userId, query = {}) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(50, Math.max(1, query.limit ?? 20));
        const where = { userId };
        if (query.status)
            where.status = query.status;
        const [reservations, total] = await Promise.all([
            prisma_1.default.reservation.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    seat: { select: { label: true, row: true, column: true } },
                    showtime: {
                        include: {
                            movie: { select: { id: true, title: true, genre: true, posterUrl: true } },
                            hall: { select: { name: true } },
                        },
                    },
                },
            }),
            prisma_1.default.reservation.count({ where }),
        ]);
        return { reservations, total, page, limit };
    }
    /** Cancel a reservation (user can only cancel their own upcoming ones) */
    async cancel(reservationId, userId) {
        const reservation = await prisma_1.default.reservation.findUnique({
            where: { id: reservationId },
            include: { showtime: true },
        });
        if (!reservation)
            throw new errors_1.NotFoundError("Reservation");
        if (reservation.userId !== userId)
            throw new errors_1.ForbiddenError();
        if (reservation.status === "CANCELLED") {
            throw new errors_1.ConflictError("Reservation is already cancelled");
        }
        if (reservation.showtime.startsAt <= new Date()) {
            throw new errors_1.ValidationError("Cannot cancel a reservation for a past or ongoing showtime");
        }
        // Release seat and cancel reservation atomically
        await prisma_1.default.$transaction([
            prisma_1.default.seat.update({
                where: { id: reservation.seatId },
                data: { isReserved: false },
            }),
            prisma_1.default.reservation.update({
                where: { id: reservationId },
                data: { status: "CANCELLED" },
            }),
        ]);
        return { message: "Reservation cancelled successfully" };
    }
    // ─────────────────────────────────────────────────────────
    // Admin-only methods
    // ─────────────────────────────────────────────────────────
    /** List all reservations with filters (admin) */
    async listAll(query = {}) {
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(100, Math.max(1, query.limit ?? 20));
        const where = {};
        if (query.status)
            where.status = query.status;
        if (query.showtimeId)
            where.showtimeId = query.showtimeId;
        const [reservations, total] = await Promise.all([
            prisma_1.default.reservation.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { id: true, name: true, email: true } },
                    seat: { select: { label: true } },
                    showtime: {
                        include: {
                            movie: { select: { title: true } },
                            hall: { select: { name: true } },
                        },
                    },
                },
            }),
            prisma_1.default.reservation.count({ where }),
        ]);
        return { reservations, total, page, limit };
    }
    /**
     * Revenue and capacity report (admin).
     * Aggregates by showtime, computing:
     *   - total seats, reserved seats, occupancy %
     *   - total revenue, projected revenue
     */
    async report(filters = {}) {
        const where = {};
        if (filters.fromDate || filters.toDate) {
            where.startsAt = {};
            if (filters.fromDate)
                where.startsAt.gte = new Date(filters.fromDate);
            if (filters.toDate)
                where.startsAt.lte = new Date(filters.toDate);
        }
        if (filters.movieId)
            where.movieId = filters.movieId;
        const showtimes = await prisma_1.default.showtime.findMany({
            where,
            include: {
                movie: { select: { id: true, title: true, genre: true } },
                hall: { select: { name: true } },
                _count: { select: { seats: true } },
                reservations: {
                    where: { status: "CONFIRMED" },
                    select: { amountPaid: true },
                },
            },
            orderBy: { startsAt: "asc" },
        });
        const rows = showtimes.map((s) => {
            const totalSeats = s._count.seats;
            const reservedSeats = s.reservations.length;
            const revenue = s.reservations.reduce((sum, r) => sum + Number(r.amountPaid), 0);
            return {
                showtimeId: s.id,
                movie: s.movie.title,
                genre: s.movie.genre,
                hall: s.hall.name,
                startsAt: s.startsAt,
                totalSeats,
                reservedSeats,
                availableSeats: totalSeats - reservedSeats,
                occupancyPct: totalSeats
                    ? Math.round((reservedSeats / totalSeats) * 100)
                    : 0,
                revenue: revenue.toFixed(2),
                currency: s.priceCurrency,
            };
        });
        const summary = {
            totalShowtimes: rows.length,
            totalReservations: rows.reduce((s, r) => s + r.reservedSeats, 0),
            totalRevenue: rows.reduce((s, r) => s + Number(r.revenue), 0).toFixed(2),
            avgOccupancyPct: rows.length
                ? Math.round(rows.reduce((s, r) => s + r.occupancyPct, 0) / rows.length)
                : 0,
        };
        return { summary, showtimes: rows };
    }
}
exports.ReservationService = ReservationService;
exports.reservationService = new ReservationService();
//# sourceMappingURL=reservation.service.js.map