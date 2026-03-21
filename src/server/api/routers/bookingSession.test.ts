import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    bookingSessionRouter,
    validateSession,
    reserveSeats,
} from "./bookingSession";
import { BookingStep } from "@prisma/client";

// Test cases for bookingSessionRouter.get procedure
describe("bookingSessionRouter.get", () => {
    let mockCtx: any;

    beforeEach(() => {
        mockCtx = {
            user: { id: "user-123" },
            db: {
                bookingSession: {
                    findFirst: vi.fn(),
                },
            },
        };
    });

    // Test case for retrieving an active booking session for the current user
    it("should return an active booking session for the current user", async () => {
        const mockSession = {
            id: "session-123",
            userId: "user-123",
            showtimeId: "showtime-123",
            step: BookingStep.SEAT_SELECTION,
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 600000),
            ticketCount: 2,
            showtime: {
                id: "showtime-123",
                movie: {
                    id: "movie-123",
                    title: "Test Movie",
                    posterUrl: "https://example.com/poster.jpg",
                    backdropUrl: "https://example.com/backdrop.jpg",
                    languages: "en,es",
                },
            },
            selectedSeats: [],
        };

        mockCtx.db.bookingSession.findFirst.mockResolvedValue(mockSession);

        const caller = bookingSessionRouter.createCaller(mockCtx);
        const result = await caller.get();

        expect(result).toEqual(mockSession);
        expect(mockCtx.db.bookingSession.findFirst).toHaveBeenCalledWith({
            where: {
                userId: "user-123",
                expiresAt: { gt: expect.any(Date) },
                step: { not: BookingStep.COMPLETED },
            },
            orderBy: { startedAt: "desc" },
            include: expect.any(Object),
        });
    });

    // Test case for when no active booking session exists for the current user
    it("should return null if no active session exists", async () => {
        mockCtx.db.bookingSession.findFirst.mockResolvedValue(null);

        const caller = bookingSessionRouter.createCaller(mockCtx);
        const result = await caller.get();

        expect(result).toBeNull();
    });

    // Test case for ensuring selected seats include seat details
    it("should include selected seats with seat details", async () => {
        const mockSession = {
            id: "session-123",
            userId: "user-123",
            selectedSeats: [
                {
                    id: "showtimeseat-1",
                    seat: {
                        id: "seat-1",
                        row: 1,
                        number: 5,
                    },
                },
                {
                    id: "showtimeseat-2",
                    seat: {
                        id: "seat-2",
                        row: 1,
                        number: 6,
                    },
                },
            ],
        };

        mockCtx.db.bookingSession.findFirst.mockResolvedValue(mockSession);

        const caller = bookingSessionRouter.createCaller(mockCtx);
        const result = await caller.get();

        expect(result?.selectedSeats).toHaveLength(2);
        expect(result?.selectedSeats?.[0]?.seat).toEqual({
            id: "seat-1",
            row: 1,
            number: 5,
        });
        expect(result?.selectedSeats?.[1]?.seat).toEqual({
            id: "seat-2",
            row: 1,
            number: 6,
        });
    });
});

// Test cases for validateSession function
describe("validateSession", () => {
    // Test case for when session is valid
    it("throws an error if session is not found", () => {
        expect(() => validateSession(null, "user-123", new Date())).toThrow(
            "Session not found"
        );
    });

    //  Test case for when session belongs to a different user
    it("throws an error if session belongs to a different user", () => {
        const session = {
            userId: "user-456",
            expiresAt: new Date(Date.now() + 600000),
        };
        expect(() => validateSession(session, "user-123", new Date())).toThrow(
            "Unauthorized"
        );
    });

    // Test case for when session has expired
    it("throws an error if session has expired", () => {
        const session = {
            userId: "user-123",
            expiresAt: new Date(Date.now() - 600000),
        };
        expect(() => validateSession(session, "user-123", new Date())).toThrow(
            "Session has expired"
        );
    });
});

// Test cases for reserveSeats function
describe("reserveSeats", () => {
    // Test case for successfully reserving seats
    it("reserves seats successfully", async () => {
        const now = new Date("2026-03-03T10:00:00-06:00");
        const seatIds = ["seat-1", "seat-2"];
        const showtimeId = "showtime-123";
        const userId = "user-123";
        const bookingSessionId = "12345";

        const tx = {
            showtimeSeat: {
                updateMany: vi.fn().mockResolvedValue({ count: 2 }),
                findMany: vi
                    .fn()
                    .mockResolvedValue([{ id: "sts-1" }, { id: "sts-2" }]),
            },
            bookingSession: {
                update: vi.fn().mockResolvedValue({}),
            },
        };

        const mockDb: any = {
            $transaction: vi.fn(async (cb: any) => cb(tx)),
        };

        await reserveSeats(
            mockDb,
            showtimeId,
            seatIds,
            userId,
            bookingSessionId,
            now
        );

        expect(mockDb.$transaction).toHaveBeenCalledTimes(1);

        expect(tx.showtimeSeat.updateMany).toHaveBeenCalledWith({
            where: {
                showtimeId: showtimeId,
                seatId: { in: seatIds },
                isBooked: false,
                OR: [
                    { heldTill: null },
                    { heldTill: { lt: now } },
                    { heldByUserId: userId },
                ],
            },
            data: {
                heldByUserId: userId,
                heldTill: expect.any(Date), // computed using SEAT_HOLD_DURATION_MS
            },
        });

        expect(tx.showtimeSeat.findMany).toHaveBeenCalledWith({
            where: {
                showtimeId,
                seatId: { in: seatIds },
            },
            select: { id: true },
        });

        expect(tx.bookingSession.update).toHaveBeenCalledWith({
            where: { id: bookingSessionId },
            data: {
                step: BookingStep.CHECKOUT,
                selectedSeats: {
                    connect: [{ id: "sts-1" }, { id: "sts-2" }],
                },
            },
        });
    });
});

// Test for expiry calculation in bookingSessionRouter.create

describe("bookingSessionRouter.create", () => {
    let mockCtx: any;
    beforeEach(() => {
        mockCtx = {
            user: { id: "user-abc" },
            db: {
                bookingSession: {
                    deleteMany: vi.fn().mockResolvedValue({}),
                    create: vi.fn().mockResolvedValue({ id: "session-1" }),
                },
            },
        };
    });

    it("should set expiresAt to now + BOOKING_SESSION_DURATION_MS", async () => {
        const now = new Date("2026-03-17T12:00:00Z");
        vi.setSystemTime(now);
        const caller = bookingSessionRouter.createCaller(mockCtx);
        await caller.create({ showtimeId: "showtime-xyz" });
        expect(mockCtx.db.bookingSession.create).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    expiresAt: new Date(now.getTime() + 5 * 60 * 1000),
                }),
            })
        );
        vi.useRealTimers();
    });
});

// Test for OR array in setTicketCount

describe("setTicketCount", () => {
    it("should use correct OR array for available seats", async () => {
        const db = {
            showtimeSeat: {
                count: vi.fn().mockResolvedValue(10),
            },
            bookingSession: {
                update: vi.fn().mockResolvedValue({}),
            },
        };
        const now = new Date();
        const ticketCount = 2;
        const showtimeId = "showtime-1";
        const userId = "user-1";
        const bookingSessionId = "session-1";
        const mod = await import("./bookingSession");
        await mod.setTicketCount(
            db as any,
            ticketCount,
            showtimeId,
            userId,
            bookingSessionId,
            now
        );
        expect(db.showtimeSeat.count).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    OR: [
                        { heldTill: null },
                        { heldTill: { lt: now } },
                        { heldByUserId: userId },
                    ],
                }),
            })
        );
    });
});

// Test for invalid step transitions in bookingSessionRouter.update

describe("bookingSessionRouter.update", () => {
    let mockCtx: any;
    beforeEach(() => {
        mockCtx = {
            user: { id: "user-abc" },
            db: {
                bookingSession: {
                    findUniqueOrThrow: vi.fn(),
                },
            },
        };
    });

    it("should throw if trying to complete booking from wrong step", async () => {
        const session = {
            id: "session-1",
            userId: "user-abc",
            step: BookingStep.SEAT_SELECTION, // not CHECKOUT
            showtimeId: "showtime-xyz",
            ticketCount: 2,
            expiresAt: new Date(Date.now() + 10000),
            selectedSeats: [],
        };
        mockCtx.db.bookingSession.findUniqueOrThrow.mockResolvedValue(session);
        const caller = bookingSessionRouter.createCaller(mockCtx);
        await expect(
            caller.update({
                sessionId: "session-1",
                goToStep: BookingStep.COMPLETED,
            })
        ).rejects.toThrow(/Invalid step transition/);
    });

    it("should throw if trying to complete booking with wrong goToStep", async () => {
        const session = {
            id: "session-1",
            userId: "user-abc",
            step: BookingStep.CHECKOUT,
            showtimeId: "showtime-xyz",
            ticketCount: 2,
            expiresAt: new Date(Date.now() + 10000),
            selectedSeats: [],
        };
        mockCtx.db.bookingSession.findUniqueOrThrow.mockResolvedValue(session);
        const caller = bookingSessionRouter.createCaller(mockCtx);
        await expect(
            caller.update({
                sessionId: "session-1",
                goToStep: BookingStep.SEAT_SELECTION,
            })
        ).rejects.toThrow(/Invalid step transition/);
    });
});
