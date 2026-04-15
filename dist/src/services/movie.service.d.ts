import { Genre } from "@prisma/client";
export interface CreateMovieInput {
    title: string;
    description: string;
    durationMin: number;
    genre: Genre;
    posterUrl?: string;
}
export interface UpdateMovieInput extends Partial<CreateMovieInput> {
}
export interface MovieQuery {
    genre?: Genre;
    search?: string;
    page?: number;
    limit?: number;
}
export declare class MovieService {
    /** List movies with optional genre/search filter and pagination */
    list(query?: MovieQuery): Promise<{
        movies: {
            id: string;
            createdAt: Date;
            _count: {
                showtimes: number;
            };
            title: string;
            description: string;
            durationMin: number;
            genre: import(".prisma/client").$Enums.Genre;
            posterUrl: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    /** Get a single movie with its upcoming showtimes */
    getById(id: string): Promise<{
        showtimes: ({
            hall: {
                id: string;
                name: string;
                rows: number;
                columns: number;
            };
            _count: {
                reservations: number;
                seats: number;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            startsAt: Date;
            movieId: string;
            hallId: string;
            endsAt: Date;
            priceAmount: import("@prisma/client/runtime/library").Decimal;
            priceCurrency: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        durationMin: number;
        genre: import(".prisma/client").$Enums.Genre;
        posterUrl: string | null;
    }>;
    /** Create a new movie */
    create(input: CreateMovieInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        durationMin: number;
        genre: import(".prisma/client").$Enums.Genre;
        posterUrl: string | null;
    }>;
    /** Update movie details */
    update(id: string, input: UpdateMovieInput): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        durationMin: number;
        genre: import(".prisma/client").$Enums.Genre;
        posterUrl: string | null;
    }>;
    /** Delete a movie and cascade-delete its showtimes & seats */
    delete(id: string): Promise<void>;
}
export declare const movieService: MovieService;
//# sourceMappingURL=movie.service.d.ts.map