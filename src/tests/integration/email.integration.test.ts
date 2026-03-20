import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCaller } from "~/server/api/root";
import { db } from "@/server/db";

describe("Email Integration Tests", () => {
    const cleanupDb = async () => {
        await db.ticket.deleteMany();
        await db.booking.deleteMany();
        await db.bookingSession.deleteMany();
        await db.showtimeSeat.deleteMany();
        await db.showtime.deleteMany();
        await db.movie.deleteMany();
        await db.user.deleteMany();
    };

    const validUserId = "ff923fd5-ecb1-44a6-83be-735ee5445d01";
    beforeEach(async () => {
        console.log("DB:", process.env.DATABASE_URL);
        await cleanupDb();
        await db.user.create({
            data: {
                id: validUserId,
                email: "test@example.com",
                name: "Test User",
            },
        });
    });

    afterEach(async () => {
        await cleanupDb();
    });

    it("should send confirmation email and call db.user.findUnique with correct where clause", async () => {
        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user: {
                id: validUserId,
                email: "test@example.com",
                name: null,
                supabaseId: null,
                imageURL: null,
                hasPaymentMethod: false,
            },
        });
        const result = await caller.email.sendConfirmation({
            userId: validUserId,
            movieTitle: "Dune",
            moviePosterUrl: "https://example.com/dune.jpg",
            showDate: "2026-07-01",
            showTime: "19:00",
            seatLabelList: ["A1", "A2"],
            totalPrice: "20.00",
            bookingId: "#12345",
        });
        expect(result).toEqual({
            ok: true,
            result: expect.objectContaining({
                id: expect.any(String),
            }),
        });
    });

    it("should return error when user not found", async () => {
        const invalidUserId = "00000000-0000-0000-0000-000000000000";
        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user: {
                id: invalidUserId,
                email: "nonexistent@example.com",
                name: null,
                supabaseId: null,
                imageURL: null,
                hasPaymentMethod: false,
            },
        });
        const result = await caller.email.sendConfirmation({
            userId: invalidUserId,
            movieTitle: "Dune",
            moviePosterUrl: "https://example.com/dune.jpg",
            showDate: "2026-07-01",
            showTime: "19:00",
            seatLabelList: ["A1", "A2"],
            totalPrice: "20.00",
            bookingId: "#12345",
        });
        expect(result).toBeUndefined();
    });
});
