// src/services/movie.service.ts
import prisma from "../utils/prisma";
import { NotFoundError } from "../utils/errors";
import { Genre } from "@prisma/client";

export interface CreateMovieInput {
  title: string;
  description: string;
  durationMin: number;
  genre: Genre;
  posterUrl?: string;
}

export interface UpdateMovieInput extends Partial<CreateMovieInput> {}

export interface MovieQuery {
  genre?: Genre;
  search?: string;
  page?: number;
  limit?: number;
}

export class MovieService {
  /** List movies with optional genre/search filter and pagination */
  async list(query: MovieQuery = {}) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(50, Math.max(1, query.limit ?? 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.genre) where.genre = query.genre;
    if (query.search) {
      where.title = { contains: query.search, mode: "insensitive" };
    }

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
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
      prisma.movie.count({ where }),
    ]);

    return { movies, total, page, limit };
  }

  /** Get a single movie with its upcoming showtimes */
  async getById(id: string) {
    const movie = await prisma.movie.findUnique({
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
    if (!movie) throw new NotFoundError("Movie");
    return movie;
  }

  /** Create a new movie */
  async create(input: CreateMovieInput) {
    return prisma.movie.create({
      data: input,
    });
  }

  /** Update movie details */
  async update(id: string, input: UpdateMovieInput) {
    await this.getById(id); // throws NotFoundError if missing
    return prisma.movie.update({ where: { id }, data: input });
  }

  /** Delete a movie and cascade-delete its showtimes & seats */
  async delete(id: string) {
    await this.getById(id);
    await prisma.movie.delete({ where: { id } });
  }
}

export const movieService = new MovieService();