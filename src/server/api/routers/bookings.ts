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
import { formatPaymentDateTime, maskCardNumber } from "~/server/utils";

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

            const showtimeSeatIds = booking.tickets.map(
                (ticket) => ticket.showtimeSeatId
            );

            await ctx.db.$transaction(async (tx) => {
                await tx.booking.update({
                    where: { id: input.bookingId },
                    data: { status: BookingStatus.CANCELLED },
                });
                await tx.ticket.updateMany({
                    where: { bookingId: input.bookingId },
                    data: { status: TicketStatus.CANCELLED },
                });
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

                // fetch movie details from the movieID
                const movieDetails = await tx.movie.findUnique({
                    where: { id: booking.showtime.movieId },
                });

                if (!movieDetails || !movieDetails.posterUrl) return;

                // fetch showtime seats details from the showtimeSeatID
                const showtimeSeats = await tx.showtimeSeat.findMany({
                    where: { id: { in: showtimeSeatIds } },
                });

                // process showtime seats to fetch seatID and store it in an array
                const seatIds = showtimeSeats.map(
                    (showtimeSeat) => showtimeSeat.seatId
                );

                // fetch seat details from the seatID
                const seats = await tx.seat.findMany({
                    where: { id: { in: seatIds } },
                });

                // return seat lable array [A1, A2, ...] from the seat row and seat number
                const formattedSeatLabels = seats.map((seat) => {
                    return formatSeatFromCode(seat.row, seat.number);
                });

                const resend = new Resend(env.RESEND_EMAIL_API_KEY ?? "");

                // sends email using the cancellation email template
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
                        seatLabelList: formattedSeatLabels,
                        refundAmount: formatCad(Number(booking.totalAmount)),
                        bookingId: formatBookingNumber(booking.bookingNumber),
                        paymentMethod: maskCardNumber(ctx.user.cardNumber),
                        refundDateTime: formatPaymentDateTime(new Date()),
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
