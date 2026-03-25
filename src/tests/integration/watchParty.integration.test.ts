import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCaller } from "~/server/api/root";
import { db } from "~/server/db";

describe("Watch Party Integration Tests", () => {
    const cleanupDb = async () => {
        await db.watchParty.deleteMany();
        await db.user.deleteMany();
    };

    beforeEach(async () => {
        await cleanupDb();
        await db.user.create({
            data: {
                id: "ff923fd5-ecb1-44a6-83be-735ee5445d01",
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
            },
        });
    });

    afterEach(async () => {
        await cleanupDb();
    });

    it("should create a watch party for a showtime", async () => {
        const movie = await db.movie.create({
            data: {
                id: "movie-1",
                tmdbId: 12345,
                title: "Test Movie",
                releaseDate: new Date(),
                runtime: 120,
            },
        });
        const showtime = await db.showtime.create({
            data: {
                id: "showtime-1",
                movieId: movie.id,
                startTime: new Date(Date.now() + 1000 * 60 * 60),
                endTime: new Date(Date.now() + 1000 * 60 * 120),
                price: 15.0,
            },
        });
        const user = await db.user.create({
            data: {
                email: "host@example.com",
                firstName: "Host",
                lastName: "User",
            },
        });

        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user,
        });

        const watchParty = await caller.watchParty.create({
            showtimeId: showtime.id,
            name: "Friday Movie Night",
            emails: ["participants@example.com"],
        });

        expect(watchParty).toBeDefined();
        expect(watchParty.showtimeId).toBe(showtime.id);
        expect(watchParty.name).toBe("Friday Movie Night");
        expect(watchParty.hostUserId).toBe(user.id);
        expect(watchParty.inviteCode).toBeDefined();
    });

    it("should allow users to join a watch party with a valid invite code", async () => {
        const watchParty = await db.watchParty.create({
            data: {
                id: "watchparty-1",
                showtimeId: "showtime-1",
                name: "Friday Movie Night",
                hostUserId: "ff923fd5-ecb1-44a6-83be-735ee5445d01",
                inviteCode: "ABC1234",
            },
        });

        const user = await db.user.create({
            data: {
                email: "participant@example.com",
                firstName: "Participant",
                lastName: "User",
            },
        });

        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user,
        });

        const result = await caller.watchParty.join({
            inviteCode: watchParty.inviteCode,
        });

        expect(result).toBeDefined();
        const updatedWatchParty = await db.watchParty.findUnique({
            where: { id: watchParty.id },
            include: { participants: true },
        });
        expect(updatedWatchParty?.participants).toHaveLength(1);
        expect(updatedWatchParty?.participants[0]?.email).toBe(user.email);
    });
});
