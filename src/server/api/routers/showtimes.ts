import { z } from "zod";
import {
    createTRPCRouter,
    protectedProcedure,
    publicProcedure,
} from "~/server/api/trpc";
import { db } from "~/server/db";

export const showtimesRouter = createTRPCRouter({
    getByMovie: publicProcedure
        .input(z.object({ movieId: z.string() }))
        .query(async ({ input }) => {
            /**
             * Load the basic movie info and future showtimes together because
             * this page needs both at the same time.
             */
            const movie = await db.movie.findUnique({
                where: { id: input.movieId },
                select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                    showtimes: {
                        where: {
                            // Only show times people can still book.
                            startTime: { gt: new Date() },
                        },
                        // Keep the picker in time order.
                        orderBy: { startTime: "asc" },
                        select: {
                            id: true,
                            startTime: true,
                            price: true,
                        },
                    },
                },
            });

            if (!movie) {
                // Let the page decide how to show the missing movie state.
                return null;
            }

            // Shape the response to match what the client page expects.
            const showtimes = movie.showtimes.map((showtime) => ({
                id: showtime.id,
                startTime: showtime.startTime,
                // Turn Prisma Decimal into a plain number before sending it to
                // the client.
                price: Number(showtime.price),
            }));

            return {
                movie: {
                    id: movie.id,
                    title: movie.title,
                    posterUrl: movie.posterUrl,
                },
                showtimes,
            };
        }),
    getAvailableSeatCount: protectedProcedure
        .input(z.object({ showtimeId: z.string() }))
        .query(async ({ input, ctx }) => {
            const now = new Date();

            // A seat counts as available when it is not booked and either not held,
            // held in the past, or held by this same user.
            const availableSeatsCount = await db.showtimeSeat.count({
                where: {
                    showtimeId: input.showtimeId,
                    isBooked: false,
                    OR: [
                        { heldTill: null },
                        { heldTill: { lt: now } },
                        // Count seats held by this user as available so a page
                        // refresh does not hide their current selection.
                        { heldByUserId: ctx.user.id },
                    ],
                },
            });
            return availableSeatsCount;
        }),
});
