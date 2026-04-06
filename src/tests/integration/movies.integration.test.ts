import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCaller } from "~/server/api/root";
import { db } from "@/server/db";

describe("Movies Integration Tests", () => {
    const cleanupDb = async () => {
        await db.ticket.deleteMany();
        await db.booking.deleteMany();
        await db.bookingSession.deleteMany();
        await db.showtimeSeat.deleteMany();
        await db.showtime.deleteMany();
        await db.movie.deleteMany();
    };

    beforeEach(async () => {
        console.log("DB:", process.env.DATABASE_URL);

        await cleanupDb();

        const movie = await db.movie.create({
            data: {
                title: "Movie 1",
                posterUrl: "https://example.com/poster1.jpg",
                runtime: 120,
                tmdbId: 12345,
                releaseDate: new Date("2024-01-01"),
            },
        });

        const startTime = new Date(Date.now() + 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + 120 * 60 * 1000);

        await db.showtime.create({
            data: {
                movieId: movie.id,
                startTime,
                endTime,
                price: 15,
            },
        });

        const unreleasedMovie = await db.movie.create({
            data: {
                title: "Load Test Movie",
                posterUrl: "https://example.com/poster-load-test.jpg",
                runtime: 120,
                tmdbId: 99999,
                releaseDate: new Date("2099-01-01"),
            },
        });

        await db.showtime.create({
            data: {
                movieId: unreleasedMovie.id,
                startTime,
                endTime,
                price: 15,
            },
        });
    });

    afterEach(async () => {
        await cleanupDb();
    });

    it("should fetch now playing movies from the database through nowPlaying procedure", async () => {
        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user: null,
        });
        const movies = await caller.movies.nowPlaying({});
        expect(movies).toHaveLength(1);
        expect(movies[0]).toBeDefined();
        expect(movies[0]?.title).toBe("Movie 1");
        expect(movies[0]?.posterUrl).toBe("https://example.com/poster1.jpg");
        expect(movies[0]?.runtime).toBe(120);
        expect(movies.map((movie) => movie.title)).not.toContain(
            "Load Test Movie"
        );
    });

    it("should return an empty array when no movies exist", async () => {
        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user: null,
        });

        await cleanupDb();

        const movies = await caller.movies.nowPlaying({});

        expect(movies).toEqual([]);
        expect(movies).toHaveLength(0);
    });
});
