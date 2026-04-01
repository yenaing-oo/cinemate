import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
    bookingSessionRouter,
    goBackToSeatSelection,
    goBackToTicketQuantity,
    reserveSeats,
    validateSession,
} from "~/server/api/routers/bookingSession";
import { BookingStep, WatchPartyStatus } from "@prisma/client";

const sendEmailMock = vi.fn();

vi.mock("resend", () => {
    return {
        Resend: vi.fn().mockImplementation(() => ({
            emails: {
                send: sendEmailMock,
            },
        })),
    };
});

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

    it("should return an active booking session for the current user", async () => {
        const mockSession = {
            id: "session-123",
            userId: "user-123",
            showtimeId: "showtime-123",
            step: BookingStep.SEAT_SELECTION,
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 600000),
            ticketCount: 2,
            watchPartyId: "wp-1",
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
            watchParty: {
                id: "wp-1",
                name: "Party",
                hostUser: {
                    firstName: "Host",
                    lastName: "User",
                    email: "host@test.com",
                },
                participants: [],
            },
        };

        mockCtx.db.bookingSession.findFirst.mockResolvedValue(mockSession);

        const caller = bookingSessionRouter.createCaller(mockCtx);
        const result = await caller.get();

        expect(result).toEqual({
            ...mockSession,
            payableTicketCount: 1,
        });

        expect(mockCtx.db.bookingSession.findFirst).toHaveBeenCalledWith({
            where: {
                userId: "user-123",
                expiresAt: { gt: expect.any(Date) },
                step: { not: BookingStep.COMPLETED },
                OR: [
                    { watchPartyId: null },
                    {
                        watchParty: {
                            status: {
                                in: [WatchPartyStatus.CLOSED],
                            },
                        },
                    },
                ],
            },
            orderBy: {
                startedAt: "desc",
            },
            include: {
                showtime: {
                    include: {
                        movie: {
                            select: {
                                id: true,
                                title: true,
                                posterUrl: true,
                                backdropUrl: true,
                                languages: true,
                            },
                        },
                    },
                },
                selectedSeats: {
                    include: {
                        seat: {
                            select: {
                                id: true,
                                row: true,
                                number: true,
                            },
                        },
                    },
                },
                watchParty: {
                    select: {
                        id: true,
                        name: true,
                        hostUser: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                        participants: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                            orderBy: [
                                { firstName: "asc" },
                                { lastName: "asc" },
                                { email: "asc" },
                            ],
                        },
                    },
                },
            },
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
                heldTill: expect.any(Date),
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

describe("goBackToTicketQuantity", () => {
    it("moves the booking session back to ticket selection", async () => {
        const db = {
            bookingSession: {
                update: vi.fn().mockResolvedValue({}),
            },
        };

        await goBackToTicketQuantity(db as any, "session-1");

        expect(db.bookingSession.update).toHaveBeenCalledWith({
            where: { id: "session-1" },
            data: {
                step: BookingStep.TICKET_QUANTITY,
            },
        });
    });
});

describe("goBackToSeatSelection", () => {
    it("releases held seats and rewinds checkout to seat selection", async () => {
        const transactionClient = {
            showtimeSeat: {
                updateMany: vi.fn().mockResolvedValue({ count: 2 }),
            },
            bookingSession: {
                update: vi.fn().mockResolvedValue({}),
            },
        };

        const db = {
            $transaction: vi.fn(async (callback: any) =>
                callback(transactionClient)
            ),
        };

        await goBackToSeatSelection(db as any, {
            id: "session-1",
            selectedSeats: [
                { id: "showtime-seat-1" },
                { id: "showtime-seat-2" },
            ],
        });

        expect(transactionClient.showtimeSeat.updateMany).toHaveBeenCalledWith({
            where: {
                id: {
                    in: ["showtime-seat-1", "showtime-seat-2"],
                },
                bookingSessionId: "session-1",
                isBooked: false,
            },
            data: {
                heldByUserId: null,
                heldTill: null,
                bookingSessionId: null,
            },
        });
        expect(transactionClient.bookingSession.update).toHaveBeenCalledWith({
            where: { id: "session-1" },
            data: {
                step: BookingStep.SEAT_SELECTION,
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
        const mod = await import("~/server/api/routers/bookingSession");
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

    it("should allow ticket count when available seats exactly equals requested ticket count", async () => {
        const db = {
            showtimeSeat: {
                count: vi.fn().mockResolvedValue(2),
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

        const mod = await import("~/server/api/routers/bookingSession");

        await expect(
            mod.setTicketCount(
                db as any,
                ticketCount,
                showtimeId,
                userId,
                bookingSessionId,
                now
            )
        ).resolves.not.toThrow();

        expect(db.bookingSession.update).toHaveBeenCalled();
    });
});

describe("bookingSessionRouter.update", () => {
    let mockCtx: any;

    beforeEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        vi.restoreAllMocks();
        sendEmailMock.mockReset();

        mockCtx = {
            user: { id: "user-abc" },
            db: {
                bookingSession: {
                    findUniqueOrThrow: vi.fn(),
                    delete: vi.fn().mockResolvedValue({}),
                },
                booking: {
                    create: vi.fn().mockResolvedValue({
                        id: "booking-1",
                        status: "CONFIRMED",
                    }),
                },
                ticket: {
                    createMany: vi.fn().mockResolvedValue({ count: 1 }),
                    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                },
                showtimeSeat: {
                    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                },
                watchParty: {
                    update: vi.fn().mockResolvedValue({}),
                    findUnique: vi.fn().mockResolvedValue({
                        id: "wp-1",
                        name: "Party",
                    }),
                },
                user: {
                    findUnique: vi.fn(),
                    findMany: vi.fn(),
                },
                $transaction: vi.fn(async (cb: any) =>
                    cb({
                        bookingSession: {
                            delete: vi.fn().mockResolvedValue({}),
                        },
                        booking: {
                            create: vi.fn().mockResolvedValue({
                                id: "booking-1",
                                status: "CONFIRMED",
                            }),
                        },
                        ticket: {
                            createMany: vi.fn().mockResolvedValue({ count: 1 }),
                            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                        },
                        showtimeSeat: {
                            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
                        },
                        watchParty: {
                            update: vi.fn().mockResolvedValue({}),
                            findUnique: vi.fn().mockResolvedValue({
                                id: "wp-1",
                                name: "Party",
                            }),
                        },
                    })
                ),
            },
        };
    });

    it("should throw if trying to complete booking from wrong step", async () => {
        const session = {
            id: "session-1",
            userId: "user-abc",
            step: BookingStep.SEAT_SELECTION,
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

    it("should allow moving back from checkout to seat selection", async () => {
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
        mockCtx.db.$transaction = vi.fn(async (callback: any) =>
            callback({
                showtimeSeat: {
                    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
                },
                bookingSession: {
                    update: vi.fn().mockResolvedValue({}),
                },
            })
        );
        const caller = bookingSessionRouter.createCaller(mockCtx);
        await expect(
            caller.update({
                sessionId: "session-1",
                goToStep: BookingStep.SEAT_SELECTION,
            })
        ).resolves.toBeUndefined();
    });

    it("should allow moving back from seat selection to ticket quantity for standard bookings", async () => {
        const session = {
            id: "session-1",
            userId: "user-abc",
            step: BookingStep.SEAT_SELECTION,
            showtimeId: "showtime-xyz",
            ticketCount: 2,
            watchPartyId: null,
            expiresAt: new Date(Date.now() + 10000),
            selectedSeats: [],
        };

        mockCtx.db.bookingSession.findUniqueOrThrow.mockResolvedValue(session);
        mockCtx.db.bookingSession.update = vi.fn().mockResolvedValue({});

        const caller = bookingSessionRouter.createCaller(mockCtx);
        await expect(
            caller.update({
                sessionId: "session-1",
                goToStep: BookingStep.TICKET_QUANTITY,
            })
        ).resolves.toBeUndefined();
    });

    it("should reject moving a watch party session back to ticket quantity", async () => {
        const session = {
            id: "session-1",
            userId: "user-abc",
            step: BookingStep.SEAT_SELECTION,
            showtimeId: "showtime-xyz",
            ticketCount: 2,
            watchPartyId: "party-1",
            expiresAt: new Date(Date.now() + 10000),
            selectedSeats: [],
        };

        mockCtx.db.bookingSession.findUniqueOrThrow.mockResolvedValue(session);
        mockCtx.db.bookingSession.update = vi.fn().mockResolvedValue({});

        const caller = bookingSessionRouter.createCaller(mockCtx);
        await expect(
            caller.update({
                sessionId: "session-1",
                goToStep: BookingStep.TICKET_QUANTITY,
            })
        ).rejects.toThrow(/Watch party booking sessions do not support/);
    });

    it("should advance from TICKET_QUANTITY to SEAT_SELECTION when ticket count and seats are available", async () => {
        const session = {
            id: "session-1",
            userId: "user-abc",
            step: BookingStep.TICKET_QUANTITY,
            showtimeId: "showtime-xyz",
            ticketCount: null,
            watchPartyId: null,
            expiresAt: new Date(Date.now() + 10000),
            selectedSeats: [],
        };
        mockCtx.db.bookingSession.findUniqueOrThrow.mockResolvedValue(session);
        mockCtx.db.showtimeSeat = {
            ...mockCtx.db.showtimeSeat,
            count: vi.fn().mockResolvedValue(5),
        };
        mockCtx.db.bookingSession.update = vi.fn().mockResolvedValue({});
        const caller = bookingSessionRouter.createCaller(mockCtx);
        await expect(
            caller.update({
                sessionId: "session-1",
                goToStep: BookingStep.SEAT_SELECTION,
                ticketCount: 2,
            })
        ).resolves.not.toThrow();
        expect(mockCtx.db.bookingSession.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    step: BookingStep.SEAT_SELECTION,
                    ticketCount: 2,
                }),
            })
        );
    });

    it("should throw when advancing TICKET_QUANTITY → SEAT_SELECTION for a watch party session", async () => {
        const session = {
            id: "session-1",
            userId: "user-abc",
            step: BookingStep.TICKET_QUANTITY,
            showtimeId: "showtime-xyz",
            ticketCount: null,
            watchPartyId: "wp-1",
            expiresAt: new Date(Date.now() + 10000),
            selectedSeats: [],
        };
        mockCtx.db.bookingSession.findUniqueOrThrow.mockResolvedValue(session);
        const caller = bookingSessionRouter.createCaller(mockCtx);
        await expect(
            caller.update({
                sessionId: "session-1",
                goToStep: BookingStep.SEAT_SELECTION,
                ticketCount: 2,
            })
        ).rejects.toThrow(
            "Watch party booking sessions start at seat selection — ticket quantity step is not applicable."
        );
    });

    it("should throw when watch party member count does not match selected seat count", async () => {
        const selectedSeats = [{ id: "ss-1" }, { id: "ss-2" }];
        const session = {
            id: "session-1",
            userId: "user-abc",
            step: BookingStep.CHECKOUT,
            showtimeId: "showtime-xyz",
            ticketCount: 2,
            watchPartyId: "wp-1",
            expiresAt: new Date(Date.now() + 10000),
            selectedSeats,
        };
        mockCtx.db.bookingSession.findUniqueOrThrow.mockResolvedValue(session);

        mockCtx.db.$transaction = vi.fn(async (cb: any) =>
            cb({
                showtimeSeat: {
                    updateMany: vi.fn().mockResolvedValue({ count: 2 }),
                    findMany: vi.fn().mockResolvedValue([
                        { id: "ss-1", seat: { row: 1, number: 1 } },
                        { id: "ss-2", seat: { row: 1, number: 2 } },
                    ]),
                },
                showtime: {
                    findUniqueOrThrow: vi.fn().mockResolvedValue({
                        price: 15,
                        startTime: new Date("2026-06-01T20:00:00Z"),
                        movie: {
                            title: "Test Movie",
                            posterUrl: "/poster.jpg",
                        },
                    }),
                },
                watchParty: {
                    findUnique: vi.fn().mockResolvedValue({
                        hostUserId: "user-abc",
                        participants: [],
                    }),
                },
                user: {
                    findMany: vi
                        .fn()
                        .mockResolvedValue([
                            { id: "user-abc", email: "host@test.com" },
                        ]),
                },
                bookingSession: {
                    update: vi.fn().mockResolvedValue({}),
                    delete: vi.fn().mockResolvedValue({}),
                },
                booking: {
                    create: vi.fn().mockResolvedValue({
                        id: "booking-1",
                        bookingNumber: 1001,
                    }),
                },
                ticket: {
                    create: vi.fn().mockResolvedValue({}),
                },
            })
        );

        const caller = bookingSessionRouter.createCaller(mockCtx);
        await expect(
            caller.update({
                sessionId: "session-1",
                goToStep: BookingStep.COMPLETED,
            })
        ).rejects.toThrow(
            "Watch party member count does not match selected seat count."
        );
    });

    it("should assign watch party tickets in sorted selected seat order", async () => {
        const ticketCreateMock = vi.fn().mockResolvedValue({});
        const bookingCreateMock = vi.fn().mockResolvedValue({
            id: "booking-1",
            bookingNumber: 1001,
        });
        const watchPartyUpdateMock = vi.fn().mockResolvedValue({});
        const bookingSessionDeleteMock = vi.fn().mockResolvedValue({});

        const session = {
            id: "session-1",
            userId: "user-abc",
            step: BookingStep.CHECKOUT,
            showtimeId: "showtime-xyz",
            ticketCount: 2,
            watchPartyId: "wp-1",
            expiresAt: new Date(Date.now() + 10000),
            // intentionally unsorted
            selectedSeats: [{ id: "ss-2" }, { id: "ss-1" }],
        };

        mockCtx.db.bookingSession.findUniqueOrThrow.mockResolvedValue(session);

        mockCtx.db.$transaction = vi.fn(async (cb: any) =>
            cb({
                showtimeSeat: {
                    updateMany: vi.fn().mockResolvedValue({ count: 2 }),
                    findMany: vi.fn().mockResolvedValue([
                        { id: "ss-1", seat: { row: 1, number: 1 } },
                        { id: "ss-2", seat: { row: 1, number: 2 } },
                    ]),
                },
                showtime: {
                    findUniqueOrThrow: vi.fn().mockResolvedValue({
                        price: 15,
                        startTime: new Date("2026-06-01T20:00:00Z"),
                        movie: {
                            title: "Test Movie",
                            posterUrl: null,
                        },
                    }),
                },
                watchParty: {
                    findUnique: vi.fn().mockResolvedValue({
                        id: "wp-1",
                        hostUserId: "user-abc",
                        participants: [{ id: "user-def" }],
                    }),
                    update: watchPartyUpdateMock,
                },
                user: {
                    findMany: vi.fn().mockResolvedValue([
                        { id: "user-abc", email: "host@test.com" },
                        { id: "user-def", email: "guest@test.com" },
                    ]),
                },
                bookingSession: {
                    update: vi.fn().mockResolvedValue({}),
                    delete: bookingSessionDeleteMock,
                },
                booking: {
                    create: bookingCreateMock,
                },
                ticket: {
                    create: ticketCreateMock,
                },
            })
        );

        const caller = bookingSessionRouter.createCaller(mockCtx);

        await expect(
            caller.update({
                sessionId: "session-1",
                goToStep: BookingStep.COMPLETED,
            })
        ).resolves.toBeUndefined();

        expect(bookingCreateMock).toHaveBeenCalled();
        expect(ticketCreateMock).toHaveBeenCalledTimes(2);

        expect(ticketCreateMock.mock.calls[0]![0]).toEqual(
            expect.objectContaining({
                data: expect.objectContaining({
                    bookingId: "booking-1",
                    showtimeSeatId: "ss-1",
                    price: 15,
                    status: "VALID",
                }),
            })
        );

        // next member should get the second sorted seat
        expect(ticketCreateMock.mock.calls[1]![0]).toEqual(
            expect.objectContaining({
                data: expect.objectContaining({
                    bookingId: "booking-1",
                    showtimeSeatId: "ss-2",
                    price: 15,
                    status: "VALID",
                }),
            })
        );

        expect(watchPartyUpdateMock).toHaveBeenCalled();
    });
});

describe("bookingSessionRouter.createForWatchParty", () => {
    beforeEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
        vi.restoreAllMocks();
    });

    it("should create a booking session for the watch party host", async () => {
        const findUnique = vi.fn().mockResolvedValue({
            id: "wp-1",
            hostUserId: "user-1",
            showtimeId: "showtime-1",
            status: WatchPartyStatus.OPEN,
            _count: { participants: 2 },
        });

        const count = vi.fn().mockResolvedValue(3);

        const deleteMany = vi.fn().mockResolvedValue({ count: 1 });
        const update = vi.fn().mockResolvedValue({
            id: "wp-1",
            status: WatchPartyStatus.CLOSED,
        });

        const create = vi.fn().mockImplementation(async (args) => ({
            id: "session-1",
            userId: args.data.userId,
            showtimeId: args.data.showtimeId,
            watchPartyId: args.data.watchPartyId,
            step: args.data.step,
            ticketCount: args.data.ticketCount,
            startedAt: args.data.startedAt,
            expiresAt: args.data.expiresAt,
            showtime: {
                movie: {
                    id: "movie-1",
                    title: "Dune",
                    posterUrl: "/poster.jpg",
                    backdropUrl: "/backdrop.jpg",
                    languages: "English",
                },
            },
        }));

        const tx = {
            bookingSession: {
                deleteMany,
                create,
            },
            watchParty: {
                update,
            },
        };

        const $transaction = vi.fn(async (callback: any) => {
            return callback(tx);
        });

        const caller = bookingSessionRouter.createCaller({
            db: {
                watchParty: { findUnique },
                showtimeSeat: { count },
                $transaction,
            },
            user: { id: "user-1" },
        } as any);

        const result = await caller.createForWatchParty({
            watchPartyId: "wp-1",
        });

        expect(findUnique).toHaveBeenCalledWith({
            where: { id: "wp-1" },
            select: {
                id: true,
                hostUserId: true,
                showtimeId: true,
                status: true,
                _count: { select: { participants: true } },
            },
        });

        expect(count).toHaveBeenCalledWith({
            where: {
                showtimeId: "showtime-1",
                isBooked: false,
                OR: [
                    { heldTill: null },
                    { heldTill: { lt: expect.any(Date) } },
                    { heldByUserId: "user-1" },
                ],
            },
        });

        expect(deleteMany).toHaveBeenCalledWith({
            where: { userId: "user-1" },
        });

        expect(update).toHaveBeenCalledWith({
            where: { id: "wp-1" },
            data: { status: WatchPartyStatus.CLOSED },
        });

        expect(create).toHaveBeenCalledWith({
            data: {
                userId: "user-1",
                showtimeId: "showtime-1",
                watchPartyId: "wp-1",
                step: BookingStep.SEAT_SELECTION,
                ticketCount: 3,
                startedAt: expect.any(Date),
                expiresAt: expect.any(Date),
            },
            include: {
                showtime: {
                    include: {
                        movie: {
                            select: {
                                id: true,
                                title: true,
                                posterUrl: true,
                                backdropUrl: true,
                                languages: true,
                            },
                        },
                    },
                },
            },
        });

        expect(result).toEqual({
            id: "session-1",
            userId: "user-1",
            showtimeId: "showtime-1",
            watchPartyId: "wp-1",
            step: BookingStep.SEAT_SELECTION,
            ticketCount: 3,
            startedAt: expect.any(Date),
            expiresAt: expect.any(Date),
            showtime: {
                movie: {
                    id: "movie-1",
                    title: "Dune",
                    posterUrl: "/poster.jpg",
                    backdropUrl: "/backdrop.jpg",
                    languages: "English",
                },
            },
        });
    });

    it("should throw when user is not host", async () => {
        const findUnique = vi.fn().mockResolvedValue({
            id: "wp-1",
            hostUserId: "other-user",
            showtimeId: "showtime-1",
            status: WatchPartyStatus.OPEN,
            _count: { participants: 2 },
        });

        const caller = bookingSessionRouter.createCaller({
            db: {
                watchParty: { findUnique },
                showtimeSeat: { count: vi.fn() },
                $transaction: vi.fn(),
            },
            user: { id: "user-1" },
        } as any);

        await expect(
            caller.createForWatchParty({ watchPartyId: "wp-1" })
        ).rejects.toThrow(
            "Only the watch party host can create a booking session for the group."
        );
    });

    it("should throw when not enough seats are available", async () => {
        const findUnique = vi.fn().mockResolvedValue({
            id: "wp-1",
            hostUserId: "user-1",
            showtimeId: "showtime-1",
            status: WatchPartyStatus.OPEN,
            _count: { participants: 3 },
        });

        const count = vi.fn().mockResolvedValue(2);

        const caller = bookingSessionRouter.createCaller({
            db: {
                watchParty: { findUnique },
                showtimeSeat: { count },
                $transaction: vi.fn(),
            },
            user: { id: "user-1" },
        } as any);

        await expect(
            caller.createForWatchParty({ watchPartyId: "wp-1" })
        ).rejects.toThrow(
            "Not enough seats available for all watch party members."
        );

        expect(count).toHaveBeenCalledWith({
            where: {
                showtimeId: "showtime-1",
                isBooked: false,
                OR: [
                    { heldTill: null },
                    { heldTill: { lt: expect.any(Date) } },
                    { heldByUserId: "user-1" },
                ],
            },
        });
    });
});
