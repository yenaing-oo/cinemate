import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { z } from "zod";
import { BookingStatus, TicketStatus } from "@prisma/client";
import { env } from "~/env.mjs";
import {
    formatBookingNumber,
    formatCad,
    formatSeatFromCode,
    formatShowtimeDate,
    formatShowtimeTime,
} from "~/lib/utils";
import { Resend } from "resend";
import BookingCancellation from "~/server/emailTemplates/BookingCancellation";

const MILLISECONDS_IN_MINUTE = 60 * 1000;
const CANCELLATION_WINDOW =
    env.BOOKING_CANCEL_WINDOW_MINUTES * MILLISECONDS_IN_MINUTE;

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
            if (timeDifference < CANCELLATION_WINDOW) {
                throw new Error(
                    `Cannot cancel booking less than ${env.BOOKING_CANCEL_WINDOW_MINUTES} minutes before showtime or after showtime has started`
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

            await ctx.db.$transaction(async (tx) => {
                const userEmail = ctx.user.email;

                const movieDetails = await tx.movie.findUnique({
                    where: { id: booking.showtime.movieId },
                });

                const showtimeSeatIds = booking.tickets.map(
                    (ticket) => ticket.showtimeSeatId
                );

                const showtimeSeats = await tx.showtimeSeat.findMany({
                    where: { id: { in: showtimeSeatIds } },
                });

                const seatIds = showtimeSeats.map(
                    (showtimeSeat) => showtimeSeat.seatId
                );

                const seats = await tx.seat.findMany({
                    where: { id: { in: seatIds } },
                });

                const formattedSeatLables = seats.map((seat) => {
                    return formatSeatFromCode(seat.row, seat.number);
                });

                if (!userEmail || !movieDetails || !movieDetails.posterUrl)
                    return;

                const resend = new Resend(
                    process.env.RESEND_EMAIL_API_KEY ?? ""
                );

                const { error } = await resend.emails.send({
                    from: "Cinemate <onboarding@bookcinemate.me>",
                    to: userEmail,
                    subject: "Booking Cancelled! - Cinemate",
                    react: BookingCancellation({
                        movieTitle: movieDetails.title,
                        posterUrl: movieDetails.posterUrl,
                        date: formatShowtimeDate(booking.showtime.startTime),
                        time: formatShowtimeTime(booking.showtime.startTime),
                        screen: "#1",
                        seatLabelList: formattedSeatLables,
                        refundAmount: formatCad(Number(booking.totalAmount)),
                        bookingId: formatBookingNumber(booking.bookingNumber),
                    }),
                });

                if (error) {
                    return { error: error };
                }
            });

            return { success: true };
        }),
    latestBookingDetails: protectedProcedure.mutation(async ({ ctx }) => {
        const bookings = await ctx.db.booking.findFirst({
            where: { userId: ctx.user.id },
            orderBy: { createdAt: "desc" },
        });
        return bookings;
    }),
});
