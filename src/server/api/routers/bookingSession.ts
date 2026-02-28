import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
    BOOKING_SESSION_DURATION_MS,
    SEAT_HOLD_DURATION_MS,
} from "../../config";
import {
    BookingStatus,
    BookingStep,
    TicketStatus,
    type PrismaClient,
} from "@prisma/client";

export const bookingSessionRouter = createTRPCRouter({
    create: protectedProcedure
        .input(
            z.object({
                showtimeId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            const expiresAt = new Date(
                now.getTime() + BOOKING_SESSION_DURATION_MS
            );
            // Delete any existing sessions for this user
            await ctx.db.bookingSession.deleteMany({
                where: {
                    userId: ctx.user.id,
                },
            });
            return ctx.db.bookingSession.create({
                data: {
                    userId: ctx.user.id,
                    showtimeId: input.showtimeId,
                    step: BookingStep.TICKET_QUANTITY,
                    startedAt: now,
                    expiresAt,
                },
                include: {
                    showtime: {
                        include: {
                            movie: {
                                select: {
                                    id: true,
                                    title: true,
                                    posterUrl: true,
                                },
                            },
                        },
                    },
                },
            });
        }),

    get: protectedProcedure.query(async ({ ctx }) => {
        const now = new Date();
        const session = await ctx.db.bookingSession.findFirst({
            where: {
                userId: ctx.user.id,
                expiresAt: { gt: now },
                step: { not: BookingStep.COMPLETED },
            },
            orderBy: { startedAt: "desc" },
            include: {
                showtime: {
                    include: {
                        movie: {
                            select: {
                                id: true,
                                title: true,
                                posterUrl: true,
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
            },
        });

        return session;
    }),

    update: protectedProcedure
        .input(
            z.object({
                sessionId: z.string(),
                goToStep: z
                    .enum(
                        Object.values(BookingStep) as [
                            BookingStep,
                            ...BookingStep[],
                        ]
                    )
                    .optional(),
                ticketCount: z.number().int().positive().optional(),
                selectedShowtimeSeatIds: z.array(z.string()).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const now = new Date();
            const session = await ctx.db.bookingSession.findUniqueOrThrow({
                where: { id: input.sessionId },
                include: { selectedSeats: true },
            });

            validateSession(session, ctx.user.id, now);

            if (
                session.step === BookingStep.TICKET_QUANTITY &&
                input.goToStep === BookingStep.SEAT_SELECTION
            ) {
                if (!input.ticketCount) {
                    throw new Error(
                        "Ticket count is required for seat selection"
                    );
                }
                await setTicketCount(
                    ctx.db,
                    input.ticketCount,
                    session.showtimeId,
                    ctx.user.id,
                    session.id,
                    now
                );
                return;
            } else if (
                session.step === BookingStep.SEAT_SELECTION &&
                input.goToStep === BookingStep.CHECKOUT
            ) {
                if (!input.selectedShowtimeSeatIds) {
                    throw new Error(
                        "Selected seat IDs are required for checkout"
                    );
                }
                if (
                    input.selectedShowtimeSeatIds.length !== session.ticketCount
                ) {
                    throw new Error(
                        "Selected seat count does not match ticket count"
                    );
                }
                await reserveSeats(
                    ctx.db,
                    input.selectedShowtimeSeatIds,
                    ctx.user.id,
                    session.id,
                    now
                );
                return;
            } else if (
                session.step === BookingStep.CHECKOUT &&
                input.goToStep === BookingStep.COMPLETED
            ) {
                await completeBooking(ctx.db, session);
                return;
            } else {
                throw new Error(
                    "Invalid step transition. Cannot go from " +
                        session.step +
                        " to " +
                        input.goToStep
                );
            }
        }),
});

function validateSession(session: any, userId: string, now: Date) {
    if (!session) {
        throw new Error("Session not found");
    }
    if (session.userId !== userId) {
        throw new Error("Unauthorized");
    }
    if (session.expiresAt < now || session.step === BookingStep.COMPLETED) {
        throw new Error("Session has expired");
    }
}

async function setTicketCount(
    db: PrismaClient,
    ticketCount: number,
    showtimeId: string,
    userId: string,
    bookingSessionId: string,
    now: Date
) {
    const availableSeatsCount = await db.showtimeSeat.count({
        where: {
            showtimeId,
            isBooked: false,
            OR: [
                { heldTill: null },
                { heldTill: { lt: now } },
                { heldByUserId: userId },
            ],
        },
    });
    if (availableSeatsCount < ticketCount) {
        throw new Error(
            "Not enough seats available for the requested ticket count"
        );
    }
    await db.bookingSession.update({
        where: { id: bookingSessionId },
        data: {
            step: BookingStep.SEAT_SELECTION,
            ticketCount,
        },
    });
}

async function reserveSeats(
    db: PrismaClient,
    showtimeSeatIds: string[],
    userId: string,
    bookingSessionId: string,
    now: Date
) {
    await db.$transaction(async (tx) => {
        const count = await tx.showtimeSeat.updateMany({
            where: {
                id: { in: showtimeSeatIds },
                isBooked: false,
                OR: [
                    { heldTill: null },
                    { heldTill: { lt: now } },
                    { heldByUserId: userId },
                ],
            },
            data: {
                heldByUserId: userId,
                heldTill: new Date(now.getTime() + SEAT_HOLD_DURATION_MS),
            },
        });
        if (count.count !== showtimeSeatIds.length) {
            throw new Error(
                "Some selected seats are no longer available. Please choose different seats."
            );
        }
        await tx.bookingSession.update({
            where: { id: bookingSessionId },
            data: {
                step: BookingStep.CHECKOUT,
                selectedSeats: {
                    connect: showtimeSeatIds.map((id) => ({ id })),
                },
            },
        });
    });
}

async function completeBooking(db: PrismaClient, session: any) {
    await db.$transaction(async (tx) => {
        // 1. Mark seats as booked
        const count = await tx.showtimeSeat.updateMany({
            where: {
                id: { in: session.selectedSeats.map((s: any) => s.id) },
                isBooked: false,
                heldByUserId: session.userId,
            },
            data: {
                isBooked: true,
                heldByUserId: null,
                heldTill: null,
            },
        });
        if (count.count !== session.selectedSeats.length) {
            throw new Error(
                "Some selected seats could not be booked. Please try again."
            );
        }

        // 2. Calculate total amount (fetch price from showtime)
        const showtime = await tx.showtime.findUniqueOrThrow({
            where: { id: session.showtimeId },
            select: { price: true },
        });
        const totalAmount = showtime.price.mul(session.selectedSeats.length);

        // 3. Create booking
        const booking = await tx.booking.create({
            data: {
                totalAmount,
                status: BookingStatus.CONFIRMED,
                userId: session.userId,
                showtimeId: session.showtimeId,
            },
        });

        // 4. Create tickets
        await Promise.all(
            session.selectedSeats.map((showtimeSeat: any) =>
                tx.ticket.create({
                    data: {
                        bookingId: booking.id,
                        showtimeSeatId: showtimeSeat.id,
                        price: showtime.price,
                        status: TicketStatus.VALID,
                    },
                })
            )
        );

        // 5. Update booking session step
        await tx.bookingSession.update({
            where: { id: session.id },
            data: { step: BookingStep.COMPLETED },
        });
    });
}
