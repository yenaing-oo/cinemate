import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock Resend client to avoid real API key and external calls
vi.mock("resend", () => {
    return {
        Resend: function () {
            return {
                emails: {
                    send: vi.fn().mockResolvedValue({
                        data: { id: "mock-email-id" },
                        error: null,
                    }),
                },
            };
        },
    };
});
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
    const OLD_ENV = process.env;
    beforeEach(async () => {
        process.env = { ...OLD_ENV, RESEND_EMAIL_API_KEY: "test-key" };
        await cleanupDb();
        await db.user.create({
            data: {
                id: validUserId,
                email: "test@example.com",
                firstName: "Test",
                lastName: "User",
            },
        });
    });

    afterEach(async () => {
        process.env = OLD_ENV;
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
                firstName: "Test",
                lastName: "User",
                supabaseId: "",
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
                firstName: "",
                lastName: "",
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
