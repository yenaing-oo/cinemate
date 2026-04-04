import { PrismaClient } from "@prisma/client";
import {
    asCsvArray,
    asNumber,
    buildSequentialEmailList,
    createDedicatedLoadTestMovie,
    createLoadTestUsers,
    ensureSeatMap,
    resetLoadTestData,
    seedShowtimeSeats,
} from "./load-test-data";

const prisma = new PrismaClient();

const DEFAULT_USER_COUNT = 10;
const DEFAULT_SHOWTIME_COUNT = 6;
const DEFAULT_HOST_EMAIL_PREFIX = "watch-party-host-loadtest";
const DEFAULT_PARTICIPANT_EMAIL_PREFIX = "watch-party-participant-loadtest";
const DEFAULT_USER_EMAIL_DOMAIN = "example.com";
const LOAD_TEST_MOVIE_TMDB_ID = 551;

function getWatchPartyHostEmails() {
    const explicitEmails = asCsvArray(process.env.WATCH_PARTY_HOST_EMAILS);

    if (explicitEmails.length > 0) {
        return explicitEmails;
    }

    const userCount = Math.max(
        1,
        asNumber(
            process.env.WATCH_PARTY_LOAD_VUS ?? process.env.LOAD_VUS,
            DEFAULT_USER_COUNT
        )
    );

    return buildSequentialEmailList(userCount, {
        prefix:
            process.env.WATCH_PARTY_HOST_EMAIL_PREFIX?.trim() ||
            DEFAULT_HOST_EMAIL_PREFIX,
        domain:
            process.env.WATCH_PARTY_USER_EMAIL_DOMAIN?.trim() ||
            DEFAULT_USER_EMAIL_DOMAIN,
    });
}

function getWatchPartyParticipantEmails() {
    const explicitEmails = asCsvArray(
        process.env.WATCH_PARTY_PARTICIPANT_EMAILS
    );

    if (explicitEmails.length > 0) {
        return explicitEmails;
    }

    const userCount = Math.max(
        1,
        asNumber(
            process.env.WATCH_PARTY_LOAD_VUS ?? process.env.LOAD_VUS,
            DEFAULT_USER_COUNT
        )
    );

    return buildSequentialEmailList(userCount, {
        prefix:
            process.env.WATCH_PARTY_PARTICIPANT_EMAIL_PREFIX?.trim() ||
            DEFAULT_PARTICIPANT_EMAIL_PREFIX,
        domain:
            process.env.WATCH_PARTY_USER_EMAIL_DOMAIN?.trim() ||
            DEFAULT_USER_EMAIL_DOMAIN,
    });
}

async function main() {
    const hostEmails = getWatchPartyHostEmails();
    const participantEmails = getWatchPartyParticipantEmails();
    const allUserEmails = [...new Set([...hostEmails, ...participantEmails])];
    const showtimeCount = Math.max(
        1,
        asNumber(process.env.WATCH_PARTY_SHOWTIME_COUNT, DEFAULT_SHOWTIME_COUNT)
    );

    console.log(
        "Seeding watch party load test users, movie, showtimes, and seats..."
    );
    console.log(
        `Using ${hostEmails.length} host users, ${participantEmails.length} participant users, and ${showtimeCount} showtimes.`
    );

    await resetLoadTestData(prisma, {
        userEmails: allUserEmails,
        movieTmdbId: LOAD_TEST_MOVIE_TMDB_ID,
    });

    const seats = await ensureSeatMap(prisma);
    console.log(`Seat map ready with ${seats.length} seats.`);

    const [hosts, participants] = await Promise.all([
        createLoadTestUsers(prisma, {
            emails: hostEmails,
            idPrefix: "watch-party-host-loadtest-user",
            firstName: "WatchParty",
            lastNamePrefix: "Host",
            hasPaymentMethod: true,
        }),
        createLoadTestUsers(prisma, {
            emails: participantEmails,
            idPrefix: "watch-party-participant-loadtest-user",
            firstName: "WatchParty",
            lastNamePrefix: "Participant",
            hasPaymentMethod: false,
        }),
    ]);

    console.log(
        `Seeded ${hosts.length} watch party hosts and ${participants.length} participants.`
    );

    const showtimes = await createDedicatedLoadTestMovie(prisma, {
        tmdbId: LOAD_TEST_MOVIE_TMDB_ID,
        title: "Watch Party Load Test Movie",
        runtime: 132,
        description: "Dedicated movie for watch party load testing.",
        price: 15,
        showtimeCount,
    });

    await seedShowtimeSeats(
        prisma,
        showtimes.map((showtime) => showtime.id),
        seats.map((seat) => seat.id)
    );

    console.log(
        `Seeded movie "Watch Party Load Test Movie" with ${showtimes.length} future showtimes.`
    );
    console.log(`Watch party host users: ${hostEmails.join(", ")}`);
    console.log(
        `Watch party participant users: ${participantEmails.join(", ")}`
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
