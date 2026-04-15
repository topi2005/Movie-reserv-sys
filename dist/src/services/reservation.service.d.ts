import { Prisma } from "@prisma/client";
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
export declare class ReservationService {
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
    reserve(input: CreateReservationInput): Promise<({
        showtime: {
            movie: {
                title: string;
            };
            hall: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            startsAt: Date;
            movieId: string;
            hallId: string;
            endsAt: Date;
            priceAmount: Prisma.Decimal;
            priceCurrency: string;
        };
        seat: {
            column: number;
            row: number;
            label: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        status: import(".prisma/client").$Enums.ReservationStatus;
        showtimeId: string;
        seatId: string;
        amountPaid: Prisma.Decimal;
        currency: string;
    })[]>;
    /** Get reservations for the current user */
    listMyReservations(userId: string, query?: ReservationQuery): Promise<{
        reservations: ({
            showtime: {
                movie: {
                    id: string;
                    title: string;
                    genre: import(".prisma/client").$Enums.Genre;
                    posterUrl: string | null;
                };
                hall: {
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                startsAt: Date;
                movieId: string;
                hallId: string;
                endsAt: Date;
                priceAmount: Prisma.Decimal;
                priceCurrency: string;
            };
            seat: {
                column: number;
                row: number;
                label: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.ReservationStatus;
            showtimeId: string;
            seatId: string;
            amountPaid: Prisma.Decimal;
            currency: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    /** Cancel a reservation (user can only cancel their own upcoming ones) */
    cancel(reservationId: string, userId: string): Promise<{
        message: string;
    }>;
    /** List all reservations with filters (admin) */
    listAll(query?: ReservationQuery & {
        showtimeId?: string;
    }): Promise<{
        reservations: ({
            user: {
                email: string;
                id: string;
                name: string;
            };
            showtime: {
                movie: {
                    title: string;
                };
                hall: {
                    name: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                startsAt: Date;
                movieId: string;
                hallId: string;
                endsAt: Date;
                priceAmount: Prisma.Decimal;
                priceCurrency: string;
            };
            seat: {
                label: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            userId: string;
            status: import(".prisma/client").$Enums.ReservationStatus;
            showtimeId: string;
            seatId: string;
            amountPaid: Prisma.Decimal;
            currency: string;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * Revenue and capacity report (admin).
     * Aggregates by showtime, computing:
     *   - total seats, reserved seats, occupancy %
     *   - total revenue, projected revenue
     */
    report(filters?: {
        fromDate?: string;
        toDate?: string;
        movieId?: string;
    }): Promise<{
        summary: {
            totalShowtimes: number;
            totalReservations: number;
            totalRevenue: string;
            avgOccupancyPct: number;
        };
        showtimes: {
            showtimeId: string;
            movie: string;
            genre: import(".prisma/client").$Enums.Genre;
            hall: string;
            startsAt: Date;
            totalSeats: number;
            reservedSeats: number;
            availableSeats: number;
            occupancyPct: number;
            revenue: string;
            currency: string;
        }[];
    }>;
}
export declare const reservationService: ReservationService;
//# sourceMappingURL=reservation.service.d.ts.map