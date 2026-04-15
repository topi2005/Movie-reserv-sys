// src/services/showtime.service.ts
import { Prisma } from "@prisma/client";
import prisma from "../utils/prisma";
import { NotFoundError, ConflictError, ValidationError } from "../utils/errors";

export interface CreateShowtimeInput {
  movieId: string;
  hallId: string;
  startsAt: Date;
  priceAmount: number;
  priceCurrency?: string;
}

export interface ShowtimeQuery {
  date?: string; // ISO date string "YYYY-MM-DD"
  movieId?: string;
  hallId?: string;
}

// Generates one seat record per physical seat for a given showtime
async function createSeatsForShowtime(
  showtimeId: string,
  rows: number,
  columns: number
) {
  const seats: {
    showtimeId: string;
    row: number;
    column: number;
    label: string;
  }[] = [];

  for (let r = 1; r <= rows; r++) {
    for (let c = 1; c <= columns; c++) {
      const rowLabel = String.fromCharCode(64 + r); // A, B, C…
      seats.push({ showtimeId, row: r, column: c, label: `${rowLabel}${c}` });
    }
  }
  await prisma.seat.createMany({ data: seats, skipDuplicates: true });
}

export class ShowtimeService {
  /**
   * List showtimes, optionally filtered by date / movie / hall.
   * Returns showtimes with seat availability counts.
   */
  async list(query: ShowtimeQuery = {}) {
    const where: Prisma.ShowtimeWhereInput = {};

    if (query.movieId) where.movieId = query.movieId;
    if (query.hallId) where.hallId = query.hallId;

    if (query.date) {
      const day = new Date(query.date);
      if (isNaN(day.getTime())) throw new ValidationError("Invalid date format");
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      where.startsAt = { gte: day, lt: nextDay };
    } else {
      // Default: only future showtimes
      where.startsAt = { gte: new Date() };
    }

    const showtimes = await prisma.showtime.findMany({
      where,
      orderBy: { startsAt: "asc" },
      include: {
        movie: {
          select: {
            id: true,
            title: true,
            genre: true,
            durationMin: true,
            posterUrl: true,
          },
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
  async getById(id: string) {
    const showtime = await prisma.showtime.findUnique({
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
    if (!showtime) throw new NotFoundError("Showtime");
    return showtime;
  }

  /**
   * Create a showtime.
   * Validates:
   *  1. Movie and hall exist
   *  2. Hall has no overlapping showtime (accounts for movie duration + 15-min buffer)
   *  3. startsAt is in the future
   */
  async create(input: CreateShowtimeInput) {
    const { movieId, hallId, startsAt, priceAmount, priceCurrency = "USD" } =
      input;

    if (new Date(startsAt) <= new Date()) {
      throw new ValidationError("Showtime must be scheduled in the future");
    }

    const [movie, hall] = await Promise.all([
      prisma.movie.findUnique({ where: { id: movieId } }),
      prisma.hall.findUnique({ where: { id: hallId } }),
    ]);
    if (!movie) throw new NotFoundError("Movie");
    if (!hall) throw new NotFoundError("Hall");

    const endsAt = new Date(
      new Date(startsAt).getTime() + movie.durationMin * 60 * 1000
    );

    // Check for overlapping showtimes in the same hall (+ 15-min buffer)
    const bufferMs = 15 * 60 * 1000;
    const overlap = await prisma.showtime.findFirst({
      where: {
        hallId,
        startsAt: { lt: new Date(endsAt.getTime() + bufferMs) },
        endsAt: { gt: new Date(new Date(startsAt).getTime() - bufferMs) },
      },
    });
    if (overlap) {
      throw new ConflictError(
        `Hall "${hall.name}" already has a showtime that overlaps with this slot`
      );
    }

    const showtime = await prisma.showtime.create({
      data: { movieId, hallId, startsAt, endsAt, priceAmount, priceCurrency },
    });

    await createSeatsForShowtime(showtime.id, hall.rows, hall.columns);

    return this.getById(showtime.id);
  }

  /** Delete a showtime — only allowed if no confirmed reservations exist */
  async delete(id: string) {
    const showtime = await prisma.showtime.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reservations: { where: { status: "CONFIRMED" } } },
        },
      },
    });
    if (!showtime) throw new NotFoundError("Showtime");

    if (showtime._count.reservations > 0) {
      throw new ConflictError(
        "Cannot delete a showtime that has confirmed reservations"
      );
    }

    await prisma.showtime.delete({ where: { id } });
  }
}

export const showtimeService = new ShowtimeService();