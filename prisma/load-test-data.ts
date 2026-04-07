import { Prisma, type PrismaClient } from "@prisma/client";
import seatMap from "./fixtures/seatMap.json";

export const DEFAULT_LOAD_TEST_RELEASE_DATE = new Date(
    "2099-01-01T00:00:00.000Z"
);

export function asNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function asCsvArray(value: string | undefined) {
    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function buildSequentialEmailList(
    count: number,
    options: {
        prefix: string;
        domain: string;
    }
) {
    const width = Math.max(2, String(Math.max(count, 1)).length);

    return Array.from({ length: count }, (_, index) => {
        const sequence = String(index + 1).padStart(width, "0");
        return `${options.prefix}-${sequence}@${options.domain}`;
    });
}

function getLoadTestSupabaseId(email: string, index: number, idPrefix: string) {
    const localPart = email.split("@")[0] ?? `user-${index + 1}`;
    const normalizedLocalPart = localPart
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return `${idPrefix}-${normalizedLocalPart || index + 1}`;
}

export async function resetLoadTestData(
    prisma: PrismaClient,
    options: {
        userEmails: string[];
        movieTmdbId: number;
    }
) {
    const existingMovie = await prisma.movie.findUnique({
        where: { tmdbId: options.movieTmdbId },
        select: { id: true },
    });

    const bookingCleanupFilters: Prisma.BookingWhereInput[] = [
        {
            user: {
                email: {
                    in: options.userEmails,
                },
            },
        },
    ];
    const bookingSessionCleanupFilters: Prisma.BookingSessionWhereInput[] = [
        {
            user: {
                email: {
                    in: options.userEmails,
                },
            },
        },
    ];
    const watchPartyCleanupFilters: Prisma.WatchPartyWhereInput[] = [
        {
            hostUser: {
                email: {
                    in: options.userEmails,
                },
            },
        },
        {
            participants: {
                some: {
                    email: {
                        in: options.userEmails,
                    },
                },
            },
        },
    ];

    if (existingMovie?.id) {
        bookingCleanupFilters.push({ showtime: { movieId: existingMovie.id } });
        bookingSessionCleanupFilters.push({
            showtime: { movieId: existingMovie.id },
        });
        watchPartyCleanupFilters.push({
            showtime: { movieId: existingMovie.id },
        });
    }

    await prisma.bookingSession.deleteMany({
        where: {
            OR: bookingSessionCleanupFilters,
        },
    });

    await prisma.ticket.deleteMany({
        where: {
            booking: {
                OR: bookingCleanupFilters,
            },
        },
    });

    await prisma.booking.deleteMany({
        where: {
            OR: bookingCleanupFilters,
        },
    });

    await prisma.watchParty.deleteMany({
        where: {
            OR: watchPartyCleanupFilters,
        },
    });

    if (existingMovie?.id) {
        await prisma.showtime.deleteMany({
            where: { movieId: existingMovie.id },
        });

        await prisma.movie.delete({
            where: { id: existingMovie.id },
        });
    }

    await prisma.user.deleteMany({
        where: {
            email: {
                in: options.userEmails,
            },
        },
    });
}

export async function ensureSeatMap(prisma: PrismaClient) {
    await prisma.seat.createMany({
        data: seatMap.seats,
        skipDuplicates: true,
    });

    const seats = await prisma.seat.findMany({
        orderBy: [{ row: "asc" }, { number: "asc" }],
    });

    if (seats.length === 0) {
        throw new Error("No seats were available after seeding the seat map.");
    }

    return seats;
}

export async function createLoadTestUsers(
    prisma: PrismaClient,
    options: {
        emails: string[];
        idPrefix: string;
        firstName: string;
        lastNamePrefix: string;
        cardNumber?: string;
    }
) {
    return Promise.all(
        options.emails.map((email, index) =>
            prisma.user.create({
                data: {
                    email,
                    firstName: options.firstName,
                    lastName: `${options.lastNamePrefix}${String(
                        index + 1
                    ).padStart(2, "0")}`,
                    supabaseId: getLoadTestSupabaseId(
                        email,
                        index,
                        options.idPrefix
                    ),
                    cardNumber: options.cardNumber,
                },
            })
        )
    );
}

export async function createDedicatedLoadTestMovie(
    prisma: PrismaClient,
    options: {
        tmdbId: number;
        title: string;
        description: string;
        runtime: number;
        price: number;
        showtimeCount: number;
        releaseDate?: Date;
        posterUrl?: string;
    }
) {
    const movie = await prisma.movie.create({
        data: {
            tmdbId: options.tmdbId,
            title: options.title,
            runtime: options.runtime,
            description: options.description,
            releaseDate: options.releaseDate ?? DEFAULT_LOAD_TEST_RELEASE_DATE,
            posterUrl:
                options.posterUrl ??
                "https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
        },
    });

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    baseDate.setHours(10, 0, 0, 0);

    const showtimeData = Array.from(
        { length: options.showtimeCount },
        (_, index) => {
            const startTime = new Date(
                baseDate.getTime() + index * 3 * 60 * 60 * 1000
            );

            return {
                movieId: movie.id,
                startTime,
                endTime: new Date(
                    startTime.getTime() + options.runtime * 60 * 1000
                ),
                price: new Prisma.Decimal(options.price),
            };
        }
    );

    await prisma.showtime.createMany({
        data: showtimeData,
    });

    return prisma.showtime.findMany({
        where: { movieId: movie.id },
        orderBy: { startTime: "asc" },
    });
}

export async function seedShowtimeSeats(
    prisma: PrismaClient,
    showtimeIds: string[],
    seatIds: string[]
) {
    await prisma.showtimeSeat.createMany({
        data: showtimeIds.flatMap((showtimeId) =>
            seatIds.map((seatId) => ({
                showtimeId,
                seatId,
            }))
        ),
    });
}
