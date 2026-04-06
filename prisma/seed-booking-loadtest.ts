import { PrismaClient } from "@prisma/client";
import {
    asCsvArray,
    asNumber,
    buildSequentialEmailList as buildSequentialEmailListHelper,
    createDedicatedLoadTestMovie,
    createLoadTestUsers,
    ensureSeatMap,
    resetLoadTestData,
    seedShowtimeSeats,
} from "./load-test-data";

const prisma = new PrismaClient();

const DEFAULT_USER_COUNT = 20;
const DEFAULT_SHOWTIME_COUNT = 6;
const DEFAULT_USER_EMAIL_PREFIX = "booking-loadtest";
const DEFAULT_USER_EMAIL_DOMAIN = "example.com";
const LOAD_TEST_MOVIE_TMDB_ID = 550;

function buildSequentialEmailList(count: number) {
    return buildSequentialEmailListHelper(count, {
        prefix:
            process.env.BOOKING_USER_EMAIL_PREFIX?.trim() ||
            DEFAULT_USER_EMAIL_PREFIX,
        domain:
            process.env.BOOKING_USER_EMAIL_DOMAIN?.trim() ||
            DEFAULT_USER_EMAIL_DOMAIN,
    });
}

function getLoadTestUserEmails() {
    const explicitEmails = asCsvArray(process.env.TEST_USER_EMAILS);

    if (explicitEmails.length > 0) {
        return explicitEmails;
    }

    const userCount = Math.max(
        1,
        asNumber(
            process.env.BOOKING_LOAD_VUS ?? process.env.LOAD_VUS,
            DEFAULT_USER_COUNT
        )
    );

    return buildSequentialEmailList(userCount);
}

async function main() {
    const loadTestUserEmails = getLoadTestUserEmails();
    const showtimeCount = Math.max(
        1,
        asNumber(process.env.BOOKING_SHOWTIME_COUNT, DEFAULT_SHOWTIME_COUNT)
    );

    console.log(
        "Seeding booking load test users, movie, showtimes, and seats..."
    );
    console.log(
        `Using ${loadTestUserEmails.length} load test users and ${showtimeCount} showtimes.`
    );

    await resetLoadTestData(prisma, {
        userEmails: loadTestUserEmails,
        movieTmdbId: LOAD_TEST_MOVIE_TMDB_ID,
    });

    const seats = await ensureSeatMap(prisma);

    console.log(`Seat map ready with ${seats.length} seats.`);

    const users = await createLoadTestUsers(prisma, {
        emails: loadTestUserEmails,
        idPrefix: "booking-loadtest-user",
        firstName: "LoadTest",
        lastNamePrefix: "User",
        cardNumber: "4111111111111111",
    });

    console.log(`Seeded ${users.length} booking load test users.`);

    const showtimes = await createDedicatedLoadTestMovie(prisma, {
        tmdbId: LOAD_TEST_MOVIE_TMDB_ID,
        title: "Booking Load Test Movie",
        runtime: 139,
        description: "Dedicated movie for booking load testing.",
        price: 15,
        showtimeCount,
    });

    await seedShowtimeSeats(
        prisma,
        showtimes.map((showtime) => showtime.id),
        seats.map((seat) => seat.id)
    );

    console.log(
        `Seeded movie "Booking Load Test Movie" with ${showtimes.length} future showtimes.`
    );
    console.log(
        `Booking load test data is ready for: ${loadTestUserEmails.join(", ")}`
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
