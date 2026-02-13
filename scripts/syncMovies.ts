import "dotenv/config";
import { db } from "../src/server/db";
import {
    fetchNowPlaying,
    fetchMovieFull,
    type MovieFullResponseSchema,
} from "../src/server/services/tmdb";
import type { z } from "zod";
import { Prisma, type Movie, type Seat, type Showtime } from "@prisma/client";

// --- Constants ---
const MOVIES_FETCH_LIMIT = 10;
const TOP_CAST_COUNT = 5;
const TMDB_POSTER_SIZE = "w500";
const TMDB_BACKDROP_SIZE = "w1280";
const SHOWTIME_PRICE = new Prisma.Decimal(15.0);
const DAYS_IN_WEEK = 7;
const FRIDAY_DAY_OF_WEEK = 5; // Sunday = 0, ..., Friday = 5
const SHOWTIME_HOURS = [14, 18, 22];
const LAST_SHOWTIME_HOUR = Math.max(...SHOWTIME_HOURS);

// --- Helper Functions ---

/**
 * Generates the showtime schedule for the upcoming week, starting from the upcoming Friday. If today is Friday and it's past the last showtime hour, it will start from the next Friday.
 * @returns An array of Date objects representing the start times for each showtime.
 */
function getShowtimeSchedule(): Date[] {
    const schedule: Date[] = [];
    const today = new Date();
    const currentDay = today.getDay();

    let daysUntilFriday =
        (FRIDAY_DAY_OF_WEEK - currentDay + DAYS_IN_WEEK) % DAYS_IN_WEEK;
    if (daysUntilFriday === 0 && today.getHours() >= LAST_SHOWTIME_HOUR) {
        daysUntilFriday = DAYS_IN_WEEK;
    }

    // Calculate the date of the next Friday
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + daysUntilFriday);

    for (let i = 0; i < DAYS_IN_WEEK; i++) {
        const date = new Date(nextFriday);
        date.setDate(nextFriday.getDate() + i);
        for (const hour of SHOWTIME_HOURS) {
            date.setHours(hour, 0, 0, 0);
            schedule.push(new Date(date));
        }
    }
    return schedule;
}

/**
 * Fetches now-playing movies from TMDB and upserts them into the database.
 * @returns A promise that resolves to an array of the synced Movie objects.
 */
async function syncMoviesFromTMDB(): Promise<Movie[]> {
    console.log("Fetching now playing movies from TMDB...");
    const nowPlayingResponse = await fetchNowPlaying();
    const nowPlaying = nowPlayingResponse.results.slice(0, MOVIES_FETCH_LIMIT);

    const movieDataForUpsert = await Promise.all(
        nowPlaying.map(async (m) => {
            const full: z.infer<typeof MovieFullResponseSchema> =
                await fetchMovieFull(m.id);
            const trailer = full.videos?.results?.find(
                (v) => v.site === "YouTube" && v.type === "Trailer"
            );
            const trailerUrl = trailer
                ? `https://www.youtube.com/watch?v=${trailer.key}`
                : null;
            const cast =
                full.credits?.cast
                    ?.slice(0, TOP_CAST_COUNT)
                    .map((c) => c.name)
                    .join(", ") ?? null;
            const director =
                full.credits?.crew?.find((c) => c.job === "Director")?.name ??
                null;

            return {
                tmdbId: m.id,
                title: m.title,
                posterUrl: m.poster_path
                    ? `https://image.tmdb.org/t/p/${TMDB_POSTER_SIZE}${m.poster_path}`
                    : null,
                description: full.overview ?? null,
                releaseDate: full.release_date
                    ? new Date(full.release_date)
                    : new Date(),
                runtime: full.runtime ?? 0,
                rating: full.vote_average ?? null,
                backdropUrl: full.backdrop_path
                    ? `https://image.tmdb.org/t/p/${TMDB_BACKDROP_SIZE}${full.backdrop_path}`
                    : null,
                genres: full.genres?.map((g) => g.name).join(", ") ?? null,
                languages:
                    full.spoken_languages
                        ?.map((l) => l.english_name)
                        .join(", ") ?? null,
                cast,
                directors: director,
                trailerUrl,
            };
        })
    );

    console.log(
        `Found ${movieDataForUpsert.length} movies to sync. Upserting...`
    );
    const syncedMovies = await db.$transaction(
        movieDataForUpsert.map((data) =>
            db.movie.upsert({
                where: { tmdbId: data.tmdbId },
                create: data,
                update: data,
            })
        )
    );
    console.log(`Successfully synced ${syncedMovies.length} movies.`);
    return syncedMovies;
}

/**
 * Creates showtimes for a given list of movies.
 * @param movies - The list of movies to create showtimes for.
 * @param seats - The list of all available seats.
 * @param schedule - The schedule of showtime start times.
 * @returns A promise that resolves to an array of the newly created Showtime objects.
 */
async function createShowtimesForMovies(
    movies: Movie[],
    seats: Seat[],
    schedule: Date[]
): Promise<Showtime[]> {
    console.log("Preparing to create showtimes for synced movies...");
    const totalSeatCount = seats.length;
    const showtimesToCreate = movies.flatMap((movie) =>
        schedule.map((startTime) => {
            const endTime = new Date(
                startTime.getTime() + movie.runtime * 60000
            ); // runtime in minutes
            return {
                movieId: movie.id,
                startTime,
                endTime,
                price: SHOWTIME_PRICE,
                availableSeats: totalSeatCount,
            };
        })
    );

    if (showtimesToCreate.length === 0) {
        console.log("No new showtimes to create.");
        return [];
    }

    console.log(`Creating ${showtimesToCreate.length} showtimes...`);
    const { count } = await db.showtime.createMany({
        data: showtimesToCreate,
        skipDuplicates: true,
    });
    console.log(`Successfully created ${count} new showtimes.`);

    if (count === 0) {
        console.log(
            "No new showtimes were added to the database (they may already exist)."
        );
        return [];
    }

    // Fetch the showtimes that were just created to get their IDs
    console.log("Fetching newly created showtimes...");
    const createdShowtimes = await db.showtime.findMany({
        where: {
            movieId: { in: movies.map((m) => m.id) },
            startTime: { in: schedule },
        },
    });
    return createdShowtimes;
}

/**
 * Creates the seat entries for each new showtime.
 * @param showtimes - The list of newly created showtimes.
 * @param seats - The list of all available seats.
 */
async function createShowtimeSeats(
    showtimes: Showtime[],
    seats: Seat[]
): Promise<void> {
    console.log("Populating seats for new showtimes...");
    const showtimeSeatsToCreate = showtimes.flatMap((showtime) =>
        seats.map((seat) => ({
            showtimeId: showtime.id,
            seatId: seat.id,
        }))
    );

    if (showtimeSeatsToCreate.length === 0) {
        console.log("No showtime seats to create.");
        return;
    }

    console.log(`Creating ${showtimeSeatsToCreate.length} showtime seats...`);
    const { count } = await db.showtimeSeat.createMany({
        data: showtimeSeatsToCreate,
        skipDuplicates: true,
    });
    console.log(`Successfully created ${count} showtime seats.`);
}

// --- Main Execution ---

async function main() {
    console.log("Starting movie, showtime, and seat sync process...");

    const allSeats = await db.seat.findMany();
    if (allSeats.length === 0) {
        console.error(
            "No seats found in the database. Please seed the database first."
        );
        process.exit(1);
    }

    const syncedMovies = await syncMoviesFromTMDB();
    if (syncedMovies.length === 0) {
        console.log("No movies were synced. Exiting.");
        return;
    }

    const showtimeSchedule = getShowtimeSchedule();
    const newShowtimes = await createShowtimesForMovies(
        syncedMovies,
        allSeats,
        showtimeSchedule
    );

    if (newShowtimes.length > 0) {
        await createShowtimeSeats(newShowtimes, allSeats);
    }

    console.log("Sync process completed successfully.");
}

main()
    .catch((e) => {
        console.error("Sync failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
