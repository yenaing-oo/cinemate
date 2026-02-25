import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { format } from "date-fns-tz";
import { env } from "~/env.mjs";

type ShowtimeItem = {
    id: string;
    startTime: Date;
    price: number;
};

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

            const groups: Record<string, ShowtimeItem[]> = {};
            for (const showtime of movie.showtimes) {
                const day = format(showtime.startTime, "yyyy-MM-dd", {
                    timeZone: env.CINEMA_TIMEZONE,
                });
                if (!groups[day]) groups[day] = [];
                groups[day]!.push({
                    id: showtime.id,
                    startTime: showtime.startTime,
                    price: Number(showtime.price),
                });
            }

            const groupedShowtimes = Object.entries(groups).map(
                ([date, dayShowtimes]) => ({
                    date,
                    showtimes: dayShowtimes,
                })
            );

            return {
                movie: {
                    id: movie.id,
                    title: movie.title,
                    posterUrl: movie.posterUrl ?? "/posters/placeholder.png",
                },
                groupedShowtimes,
            };
        }),
});
