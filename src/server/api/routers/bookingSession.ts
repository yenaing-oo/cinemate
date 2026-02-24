import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import {
    BOOKING_SESSION_DURATION_MS,
    SEAT_HOLD_DURATION_MS,
} from "../../config";
import { BookingStep, type PrismaClient } from "@prisma/client";

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
            return ctx.db.bookingSession.create({
                data: {
                    userId: ctx.user.id,
                    showtimeId: input.showtimeId,
                    step: BookingStep.TICKET_QUANTITY,
                    startedAt: now,
                    expiresAt,
                },
            });
        }),

    update: protectedProcedure
        .input(
            z.object({
                sessionId: z.string(),
                step: z
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
            const session = await ctx.db.bookingSession.findUnique({
                where: { id: input.sessionId },
                include: { selectedSeats: true },
            });
            if (!session) throw new Error("Session not found");

            if (session.userId !== ctx.user.id) {
                throw new Error("Unauthorized");
            }

            if (session.expiresAt < new Date()) {
                throw new Error("Session has expired");
            }

            if (
                session.step === BookingStep.TICKET_QUANTITY &&
                input.step === BookingStep.SEAT_SELECTION
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
                    session.id
                );
            } else if (
                session.step === BookingStep.SEAT_SELECTION &&
                input.step === BookingStep.CHECKOUT
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
                    session.id
                );
            }
        }),
});

async function setTicketCount(
    db: PrismaClient,
    ticketCount: number,
    showtimeId: string,
    userId: string,
    bookingSessionId: string
) {
    const now = new Date();
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
    bookingSessionId: string
) {
    await db.$transaction(async (tx) => {
        const count = await tx.showtimeSeat.updateMany({
            where: {
                id: { in: showtimeSeatIds },
                isBooked: false,
                OR: [
                    { heldTill: null },
                    { heldTill: { lt: new Date() } },
                    { heldByUserId: userId },
                ],
            },
            data: {
                heldByUserId: userId,
                heldTill: new Date(Date.now() + SEAT_HOLD_DURATION_MS),
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
