import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BookingStatus, TicketStatus } from "@prisma/client";

vi.mock("~/env.mjs", () => ({
    env: { BOOKING_CANCEL_WINDOW_MINUTES: 60 },
}));

vi.mock("~/server/api/trpc", async () => {
    const makeProc = () => {
        const proc: any = {};
        proc.input = () => proc;
        proc.query = (resolver: any) => ({ _def: { resolver }, resolver });
        proc.mutation = (resolver: any) => ({ _def: { resolver }, resolver });
        return proc;
    };

    return {
        createTRPCRouter: (routes: any) => ({
            ...routes,
            createCaller: (ctx: any) => {
                // createCaller should call the resolvers directly
                return Object.fromEntries(
                    Object.entries(routes).map(([k, v]: any) => [
                        k,
                        (input?: any) => v.resolver({ ctx, input }),
                    ])
                );
            },
        }),
        protectedProcedure: makeProc(),
    };
});

import { bookingsRouter } from "./bookings";

//Test cases for bookingsRouter, specifically the list and cancel procedures
describe("bookingsRouter", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-03-03T10:00:00-06:00"));
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // Test case: list procedure returns bookings for the current user and calls findMany with correct query
    it("returns bookings for the current user and calls findMany with correct query", async () => {
        const mockBookings = [
            {
                id: "booking-1",
                userId: "user-123",
                createdAt: new Date(),
                showtime: { movie: { title: "Interstellar" } },
                tickets: [],
            },
        ];

        const ctx: any = {
            user: { id: "user-123" },
            db: {
                booking: {
                    findMany: vi.fn().mockResolvedValue(mockBookings),
                },
            },
        };

        const caller = bookingsRouter.createCaller(ctx);
        const result = await caller.list();

        expect(result).toEqual(mockBookings);
        expect(ctx.db.booking.findMany).toHaveBeenCalledWith({
            where: { userId: "user-123" },
            orderBy: { createdAt: "desc" },
            include: {
                showtime: { include: { movie: true } },
                tickets: {
                    include: { showtimeSeat: { include: { seat: true } } },
                },
            },
        });
    });

    // Test case: cancel procedure cancels booking, cancels tickets, and frees seats inside a transaction
    it("cancel: cancels booking, cancels tickets, and frees seats inside a transaction", async () => {
        const showtimeStart = new Date("2026-03-03T12:00:00-06:00");

        const bookingInDb = {
            id: "booking-123",
            userId: "user-123",
            status: BookingStatus.CONFIRMED,
            showtime: { startTime: showtimeStart },
            tickets: [
                { id: "ticket-1", showtimeSeatId: "sts-1" },
                { id: "ticket-2", showtimeSeatId: "sts-2" },
            ],
        };

        const movieInDb = {
            id: "movie-123",
            title: "Hoppers",
            posterUrl: "www.google.com",
        };

        const showtimeSeatInDb = [
            {
                id: "showtimeSeat-123",
                seatId: "seat-123",
            },
        ];

        const seatInDb = [
            {
                id: "seat-123",
                row: 1,
                number: 1,
            },
        ];

        const tx = {
            booking: { update: vi.fn().mockResolvedValue({}) },
            ticket: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
            showtimeSeat: {
                updateMany: vi.fn().mockResolvedValue({ count: 2 }),
                findMany: vi.fn().mockResolvedValue(showtimeSeatInDb),
            },
            movie: { findUnique: vi.fn().mockResolvedValue(movieInDb) },
            seat: { findMany: vi.fn().mockResolvedValue(seatInDb) },
        };

        const ctx: any = {
            user: { id: "user-123" },
            db: {
                booking: {
                    findUnique: vi.fn().mockResolvedValue(bookingInDb),
                },
                $transaction: vi.fn(async (cb: any) => cb(tx)),
            },
        };

        const caller = bookingsRouter.createCaller(ctx);
        const result = await caller.cancel({ bookingId: "booking-123" });

        expect(result).toEqual({ success: true });

        expect(ctx.db.booking.findUnique).toHaveBeenCalledWith({
            where: { id: "booking-123", userId: "user-123" },
            include: { showtime: true, tickets: true },
        });

        expect(tx.booking.update).toHaveBeenCalledWith({
            where: { id: "booking-123" },
            data: { status: BookingStatus.CANCELLED },
        });

        expect(tx.ticket.updateMany).toHaveBeenCalledWith({
            where: { bookingId: "booking-123" },
            data: { status: TicketStatus.CANCELLED },
        });

        expect(tx.showtimeSeat.updateMany).toHaveBeenCalledWith({
            where: { id: { in: ["sts-1", "sts-2"] } },
            data: {
                isBooked: false,
                heldByUserId: null,
                heldTill: null,
                bookingSessionId: null,
            },
        });
    });
});
