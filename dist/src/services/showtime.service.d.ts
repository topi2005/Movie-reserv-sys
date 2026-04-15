export interface CreateShowtimeInput {
    movieId: string;
    hallId: string;
    startsAt: Date;
    priceAmount: number;
    priceCurrency?: string;
}
export interface ShowtimeQuery {
    date?: string;
    movieId?: string;
    hallId?: string;
}
export declare class ShowtimeService {
    /**
     * List showtimes, optionally filtered by date / movie / hall.
     * Returns showtimes with seat availability counts.
     */
    list(query?: ShowtimeQuery): Promise<{
        totalSeats: number;
        reservedSeats: number;
        availableSeats: number;
        movie: {
            id: string;
            title: string;
            durationMin: number;
            genre: import(".prisma/client").$Enums.Genre;
            posterUrl: string | null;
        };
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
        id: string;
        createdAt: Date;
        updatedAt: Date;
        startsAt: Date;
        movieId: string;
        hallId: string;
        endsAt: Date;
        priceAmount: import("@prisma/client/runtime/library").Decimal;
        priceCurrency: string;
    }[]>;
    /** Get a single showtime with full seat map */
    getById(id: string): Promise<{
        movie: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            durationMin: number;
            genre: import(".prisma/client").$Enums.Genre;
            posterUrl: string | null;
        };
        hall: {
            id: string;
            name: string;
            createdAt: Date;
            rows: number;
            columns: number;
        };
        seats: {
            id: string;
            column: number;
            row: number;
            label: string;
            isReserved: boolean;
        }[];
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
    }>;
    /**
     * Create a showtime.
     * Validates:
     *  1. Movie and hall exist
     *  2. Hall has no overlapping showtime (accounts for movie duration + 15-min buffer)
     *  3. startsAt is in the future
     */
    create(input: CreateShowtimeInput): Promise<{
        movie: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            title: string;
            description: string;
            durationMin: number;
            genre: import(".prisma/client").$Enums.Genre;
            posterUrl: string | null;
        };
        hall: {
            id: string;
            name: string;
            createdAt: Date;
            rows: number;
            columns: number;
        };
        seats: {
            id: string;
            column: number;
            row: number;
            label: string;
            isReserved: boolean;
        }[];
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
    }>;
    /** Delete a showtime (admin only) - only if no confirmed reservations */
    delete(id: string): Promise<void>;
}
export declare const showtimeService: ShowtimeService;
//# sourceMappingURL=showtime.service.d.ts.map