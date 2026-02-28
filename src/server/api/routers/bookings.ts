import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { BookingStatus, TicketStatus } from "@prisma/client";

const MINUTES_BEFORE_SHOWTIME_TO_CANCEL = 60;
const MILLISECONDS_IN_MINUTE = 60 * 1000;

export const bookingsRouter = createTRPCRouter({
    list: protectedProcedure.query(async ({ ctx }) => {
        const bookings = await ctx.db.booking.findMany({
            where: { userId: ctx.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                showtime: {
                    include: {
                        movie: true,
                    },
                },
                tickets: {
                    include: {
                        showtimeSeat: {
                            include: {
                                seat: true,
                            },
                        },
                    },
                },
            },
        });
        return bookings;
    }),
    cancel: protectedProcedure
        .input(z.object({ bookingId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const booking = await ctx.db.booking.findUnique({
                where: { id: input.bookingId, userId: ctx.user.id },
                include: { showtime: true, tickets: true },
            });

            if (!booking) {
                throw new Error("Booking not found or access denied");
            }

            const now = new Date();
            const timeDifference =
                booking.showtime.startTime.getTime() - now.getTime();
            if (
                timeDifference <
                MINUTES_BEFORE_SHOWTIME_TO_CANCEL * MILLISECONDS_IN_MINUTE
            ) {
                throw new Error(
                    `Cannot cancel booking less than ${MINUTES_BEFORE_SHOWTIME_TO_CANCEL} minutes before showtime or after showtime has started`
                );
            }

            await ctx.db.$transaction(async (tx) => {
                await tx.booking.update({
                    where: { id: input.bookingId },
                    data: { status: BookingStatus.CANCELLED },
                });
                await tx.ticket.updateMany({
                    where: { bookingId: input.bookingId },
                    data: { status: TicketStatus.CANCELLED },
                });
                const showtimeSeatIds = booking.tickets.map(
                    (ticket) => ticket.showtimeSeatId
                );
                await tx.showtimeSeat.updateMany({
                    where: { id: { in: showtimeSeatIds } },
                    data: {
                        isBooked: false,
                        heldByUserId: null,
                        heldTill: null,
                        bookingSessionId: null,
                    },
                });
            });

            // TODO: Trigger cancellation email

            return { success: true };
        }),
});
