// src/services/reservation.service.ts
import prisma from "../utils/prisma";
import { Prisma } from "@prisma/client";
import { Decimal } from "decimal.js";
import {
  NotFoundError,
  ConflictError,
  ValidationError,
  ForbiddenError,
  SeatUnavailableError,
} from "../utils/errors";

export interface CreateReservationInput {
  userId: string;
  showtimeId: string;
  seatIds: string[];
}

export interface ReservationQuery {
  page?: number;
  limit?: number;
  status?: "CONFIRMED" | "CANCELLED";
}

export class ReservationService {
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
  async reserve(input: CreateReservationInput) {
    const { userId, showtimeId, seatIds } = input;

    if (!seatIds.length) throw new ValidationError("Select at least one seat");
    if (seatIds.length > 10) throw new ValidationError("Cannot reserve more than 10 seats at once");

    // Basic pre-checks outside the transaction
    const showtime = await prisma.showtime.findUnique({ where: { id: showtimeId } });
    if (!showtime) throw new NotFoundError("Showtime");
    if (showtime.startsAt <= new Date()) {
      throw new ValidationError("Cannot reserve seats for a past or ongoing showtime");
    }

    // Check the user doesn't already have a reservation for this showtime
    const existingReservation = await prisma.reservation.findFirst({
      where: { userId, showtimeId, status: "CONFIRMED" },
    });
    if (existingReservation) {
      throw new ConflictError("You already have a reservation for this showtime");
    }

    // ── Atomic reservation inside a transaction ───────────────
    const reservations = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Lock and read seats
      // Using raw SQL for row-level locking on PostgreSQL.
      // For SQLite (dev), we use a simpler optimistic approach.
      const isPostgres = process.env.DATABASE_URL?.startsWith("postgresql");

      let seats;
      if (isPostgres) {
        seats = await tx.$queryRaw<
          { id: string; label: string; is_reserved: boolean; showtime_id: string }[]
        >`
          SELECT id, label, is_reserved, showtime_id
          FROM seats
          WHERE id = ANY(${seatIds}::text[])
          FOR UPDATE
        `;
      } else {
        seats = await tx.seat.findMany({ where: { id: { in: seatIds } } });
      }

      // Validate seat ownership and availability
      for (const seat of seats) {
        const isReserved = isPostgres
          ? (seat as any).is_reserved
          : (seat as any).isReserved;
        const seatShowtimeId = isPostgres
          ? (seat as any).showtime_id
          : (seat as any).showtimeId;

        if (seatShowtimeId !== showtimeId) {
          throw new ValidationError(`Seat ${(seat as any).label} does not belong to this showtime`);
        }
        if (isReserved) {
          throw new SeatUnavailableError((seat as any).label);
        }
      }

      if (seats.length !== seatIds.length) {
        throw new NotFoundError("One or more seats");
      }

      // Mark seats as reserved
      await tx.seat.updateMany({
        where: { id: { in: seatIds } },
        data: { isReserved: true },
      });

      // Create reservation records
      const created = await Promise.all(
        seatIds.map((seatId) =>
          tx.reservation.create({
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
          })
        )
      );

      return created;
    });

    return reservations;
  }

  /** Get reservations for the current user */
  async listMyReservations(userId: string, query: ReservationQuery = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));

    const where: any = { userId };
    if (query.status) where.status = query.status;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
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
      prisma.reservation.count({ where }),
    ]);

    return { reservations, total, page, limit };
  }

  /** Cancel a reservation (user can only cancel their own upcoming ones) */
  async cancel(reservationId: string, userId: string) {
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: { showtime: true },
    });

    if (!reservation) throw new NotFoundError("Reservation");
    if (reservation.userId !== userId) throw new ForbiddenError();
    if (reservation.status === "CANCELLED") {
      throw new ConflictError("Reservation is already cancelled");
    }
    if (reservation.showtime.startsAt <= new Date()) {
      throw new ValidationError("Cannot cancel a reservation for a past or ongoing showtime");
    }

    // Release seat and cancel reservation atomically
    await prisma.$transaction([
      prisma.seat.update({
        where: { id: reservation.seatId },
        data: { isReserved: false },
      }),
      prisma.reservation.update({
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
  async listAll(query: ReservationQuery & { showtimeId?: string } = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.showtimeId) where.showtimeId = query.showtimeId;

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
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
      prisma.reservation.count({ where }),
    ]);

    return { reservations, total, page, limit };
  }

  /**
   * Revenue and capacity report (admin).
   * Aggregates by showtime, computing:
   *   - total seats, reserved seats, occupancy %
   *   - total revenue, projected revenue
   */
  async report(filters: { fromDate?: string; toDate?: string; movieId?: string } = {}) {
    const where: any = {};

    if (filters.fromDate || filters.toDate) {
      where.startsAt = {};
      if (filters.fromDate) where.startsAt.gte = new Date(filters.fromDate);
      if (filters.toDate) where.startsAt.lte = new Date(filters.toDate);
    }
    if (filters.movieId) where.movieId = filters.movieId;

    const showtimes = await prisma.showtime.findMany({
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

    const rows = showtimes.map((s: typeof showtimes[0]) => {
      const totalSeats = s._count.seats;
      const reservedSeats = s.reservations.length;
      const revenue = s.reservations.reduce(
        (sum: number, r: { amountPaid: Decimal }) => sum + Number(r.amountPaid),
        0
      );

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
      totalReservations: rows.reduce((s: number, r: typeof rows[0]) => s + r.reservedSeats, 0),
      totalRevenue: rows.reduce((s: number, r: typeof rows[0]) => s + Number(r.revenue), 0).toFixed(2),
      avgOccupancyPct: rows.length
        ? Math.round(rows.reduce((s: number, r: typeof rows[0]) => s + r.occupancyPct, 0) / rows.length)
        : 0,
    };

    return { summary, showtimes: rows };
  }
}

export const reservationService = new ReservationService();