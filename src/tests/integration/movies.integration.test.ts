import { beforeEach, describe, expect, it } from "vitest";
import { createCaller } from "~/server/api/root";
import { db } from "@/server/db";

describe("Movies Integration Tests", () => {
    beforeEach(async () => {
        // Clear the movies table before each test
        await db.booking.deleteMany();
        await db.movie.deleteMany();

        await db.movie.create({
            data: {
                title: "Movie 1",
                posterUrl: "https://example.com/poster1.jpg",
                runtime: 120,
                tmdbId: 12345,
                releaseDate: new Date("2024-01-01"),
            },
        });
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
    });
});
