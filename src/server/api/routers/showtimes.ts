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
            const movie = await db.movie.findUnique({
                where: { id: input.movieId },
                select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                    showtimes: {
                        where: {
                            startTime: { gt: new Date() },
                        },
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
                return null;
            }

            const showtimes = movie.showtimes.map((showtime) => ({
                id: showtime.id,
                startTime: showtime.startTime,
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
            const availableSeatsCount = await db.showtimeSeat.count({
                where: {
                    showtimeId: input.showtimeId,
                    isBooked: false,
                    OR: [
                        { heldTill: null },
                        { heldTill: { lt: now } },
                        { heldByUserId: ctx.user.id },
                    ],
                },
            });
            return availableSeatsCount;
        }),
});
