import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { BOOKING_SESSION_DURATION_MS } from "../../config";
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
                await checkEnoughSeatsAvailable(
                    ctx.db,
                    session.showtimeId,
                    ctx.user.id,
                    input.ticketCount
                );
            }

            const updateData: Record<string, any> = {
                step: input.step,
            };

            return ctx.db.bookingSession.update({
                where: { id: input.sessionId },
                data: updateData,
            });
        }),
});

// Helper function for seat availability check
async function checkEnoughSeatsAvailable(
    db: PrismaClient,
    showtimeId: string,
    userId: string,
    ticketCount: number
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
}
