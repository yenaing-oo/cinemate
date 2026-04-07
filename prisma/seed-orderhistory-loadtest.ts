import {
    Prisma,
    PrismaClient,
    TicketStatus,
    BookingStatus,
} from "@prisma/client";
import seatMap from "./fixtures/seatMap.json";

const prisma = new PrismaClient();

const DEFAULT_USER_COUNT = 20;
const DEFAULT_SHOWTIME_COUNT = 6;
const DEFAULT_USER_EMAIL_PREFIX = "booking-loadtest";
const DEFAULT_USER_EMAIL_DOMAIN = "example.com";
const LOAD_TEST_MOVIE_TMDB_ID = 550;
const LOAD_TEST_MOVIE_RELEASE_DATE = new Date("2099-01-01T00:00:00.000Z");

function asNumber(value: string | undefined, fallback: number) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function buildSequentialEmailList(count: number) {
    const prefix =
        process.env.BOOKING_USER_EMAIL_PREFIX?.trim() ||
        DEFAULT_USER_EMAIL_PREFIX;
    const domain =
        process.env.BOOKING_USER_EMAIL_DOMAIN?.trim() ||
        DEFAULT_USER_EMAIL_DOMAIN;
    const width = Math.max(2, String(Math.max(count, 1)).length);

    return Array.from({ length: count }, (_, index) => {
        const sequence = String(index + 1).padStart(width, "0");
        return `${prefix}-${sequence}@${domain}`;
    });
}

function getLoadTestUserEmails() {
    const userCount = Math.max(
        1,
        asNumber(
            process.env.BOOKING_LOAD_VUS ?? process.env.LOAD_VUS,
            DEFAULT_USER_COUNT
        )
    );
    return buildSequentialEmailList(userCount);
}

function getLoadTestSupabaseId(email: string, index: number) {
    const localPart = email.split("@")[0] ?? `user-${index + 1}`;
    const normalizedLocalPart = localPart
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    return `booking-loadtest-user-${normalizedLocalPart || index + 1}`;
}

async function main() {
    const loadTestUserEmails = getLoadTestUserEmails();
    const showtimeCount = Math.max(
        1,
        asNumber(process.env.BOOKING_SHOWTIME_COUNT, DEFAULT_SHOWTIME_COUNT)
    );

    console.log(
        "Seeding order history load test users, movie, showtimes, seats, and bookings..."
    );
    console.log(
        `Using ${loadTestUserEmails.length} load test users and ${showtimeCount} showtimes.`
    );

    const existingMovie = await prisma.movie.findUnique({
        where: { tmdbId: LOAD_TEST_MOVIE_TMDB_ID },
        select: { id: true },
    });

    if (existingMovie?.id) {
        await prisma.bookingSession.deleteMany({
            where: { showtime: { movieId: existingMovie.id } },
        });
        await prisma.ticket.deleteMany({
            where: { booking: { showtime: { movieId: existingMovie.id } } },
        });
        await prisma.booking.deleteMany({
            where: { showtime: { movieId: existingMovie.id } },
        });
        await prisma.showtimeSeat.deleteMany({
            where: { showtime: { movieId: existingMovie.id } },
        });
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
                in: loadTestUserEmails,
            },
        },
    });

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

    const users = await Promise.all(
        loadTestUserEmails.map((email, index) =>
            prisma.user.create({
                data: {
                    email,
                    firstName: "OrderHistoryTest",
                    lastName: `User${String(index + 1).padStart(2, "0")}`,
                    supabaseId: getLoadTestSupabaseId(email, index),
                },
            })
        )
    );

    const movie = await prisma.movie.create({
        data: {
            tmdbId: LOAD_TEST_MOVIE_TMDB_ID,
            title: "Order History Load Test Movie",
            runtime: 139,
            description: "Dedicated movie for order history load testing.",
            releaseDate: LOAD_TEST_MOVIE_RELEASE_DATE,
        },
    });

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    baseDate.setHours(10, 0, 0, 0);

    const showtimeData = Array.from({ length: showtimeCount }, (_, index) => {
        const startTime = new Date(
            baseDate.getTime() + index * 3 * 60 * 60 * 1000
        );
        return {
            movieId: movie.id,
            startTime,
            endTime: new Date(startTime.getTime() + movie.runtime * 60 * 1000),
            price: new Prisma.Decimal(15),
        };
    });

    await prisma.showtime.createMany({
        data: showtimeData,
    });

    const showtimes = await prisma.showtime.findMany({
        where: { movieId: movie.id },
        orderBy: { startTime: "asc" },
    });

    await prisma.showtimeSeat.createMany({
        data: showtimes.flatMap((showtime) =>
            seats.map((seat) => ({
                showtimeId: showtime.id,
                seatId: seat.id,
            }))
        ),
    });

    const firstShowtime = showtimes[0];
    const firstSeat = seats[0];
    if (!firstShowtime || !firstSeat) {
        throw new Error("No showtime or seat available for booking seeding.");
    }

    let bookingsCreated = 0;
    await Promise.all(
        users.map(async (user) => {
            try {
                console.log(`Creating booking for user: ${user.email}`);
                const showtimeSeat = await prisma.showtimeSeat.findFirst({
                    where: {
                        showtimeId: firstShowtime.id,
                        seatId: firstSeat.id,
                    },
                });
                if (!showtimeSeat) throw new Error("ShowtimeSeat not found");
                await prisma.booking.create({
                    data: {
                        userId: user.id,
                        showtimeId: firstShowtime.id,
                        totalAmount: new Prisma.Decimal(15),
                        status: BookingStatus.CONFIRMED,
                        tickets: {
                            create: [
                                {
                                    showtimeSeatId: showtimeSeat.id,
                                    status: TicketStatus.VALID,
                                    price: new Prisma.Decimal(15),
                                },
                            ],
                        },
                    },
                });
                bookingsCreated++;
            } catch (err) {
                console.error(
                    `Failed to create booking for user ${user.email}:`,
                    err
                );
            }
        })
    );
    console.log(`Total bookings created: ${bookingsCreated}`);

    console.log(
        `Seeded order history load test data for users: ${loadTestUserEmails.join(", ")}`
    );
}

main()
    .catch((error) => {
        console.error(error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
