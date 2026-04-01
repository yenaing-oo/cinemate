import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCaller } from "~/server/api/root";
import { db } from "~/server/db";

describe("Showtimes Integration Tests", () => {
    let movie1Id: string;
    let movie2Id: string;

    const cleanupDb = async () => {
        await db.showtime.deleteMany();
        await db.movie.deleteMany();
    };

    beforeEach(async () => {
        await cleanupDb();

        const movie1 = await db.movie.create({
            data: {
                title: "Interstellar",
                posterUrl: "https://example.com/interstellar.jpg",
                runtime: 169,
                tmdbId: 157336,
                releaseDate: new Date("2025-11-07"),
            },
        });

        const movie2 = await db.movie.create({
            data: {
                title: "Inception",
                posterUrl: "https://example.com/inception.jpg",
                runtime: 148,
                tmdbId: 27205,
                releaseDate: new Date("2025-07-16"),
            },
        });

        movie1Id = movie1.id;
        movie2Id = movie2.id;

        await db.showtime.createMany({
            data: [
                {
                    movieId: movie1Id,
                    startTime: new Date("2026-04-30T18:00:00Z"),
                    endTime: new Date("2026-04-30T20:49:00Z"),
                    price: "12.50",
                },
                {
                    movieId: movie1Id,
                    startTime: new Date("2026-04-30T21:00:00Z"),
                    endTime: new Date("2026-04-30T23:49:00Z"),
                    price: "12.50",
                },
                {
                    movieId: movie1Id,
                    startTime: new Date("2025-01-30T18:00:00Z"), // past showtime
                    endTime: new Date("2025-01-30T20:49:00Z"),
                    price: "12.50",
                },
                {
                    movieId: movie2Id,
                    startTime: new Date("2026-04-30T19:00:00Z"),
                    endTime: new Date("2026-04-30T21:28:00Z"),
                    price: "13.50",
                },
            ],
        });
    });

    afterEach(async () => {
        await cleanupDb();
    });

    it("should return only upcoming showtimes belonging to the selected movie", async () => {
        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user: null,
        });

        const result = await caller.showtimes.getByMovie({
            movieId: movie1Id,
        });

        expect(result).not.toBeNull();
        expect(result?.movie.id).toBe(movie1Id);
        expect(result?.movie.title).toBe("Interstellar");
        expect(result?.movie.posterUrl).toBe(
            "https://example.com/interstellar.jpg"
        );

        expect(result?.showtimes).toHaveLength(2);

        const startTimes = result!.showtimes.map((s) =>
            new Date(s.startTime).toISOString()
        );

        expect(startTimes).toContain("2026-04-30T18:00:00.000Z");
        expect(startTimes).toContain("2026-04-30T21:00:00.000Z");
        expect(startTimes).not.toContain("2026-04-30T19:00:00.000Z");
        expect(startTimes).not.toContain("2025-01-30T18:00:00.000Z");

        for (const showtime of result!.showtimes) {
            expect(showtime.id).toBeDefined();
            expect(showtime.price).toBe(12.5);
            expect(new Date(showtime.startTime).getTime()).toBeGreaterThan(
                Date.now()
            );
        }
    });
});
