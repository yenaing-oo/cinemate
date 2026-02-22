import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

type ShowtimeItem = {
    id: string;
    startTime: Date;
    availableSeats: number;
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
                },
            });

            if (!movie) {
                return null;
            }

            const showtimes = await db.showtime.findMany({
                where: {
                    movieId: input.movieId,
                    startTime: { gt: new Date() },
                },
                orderBy: { startTime: "asc" },
                select: {
                    id: true,
                    startTime: true,
                    availableSeats: true,
                    price: true,
                },
            });

            const groups: Record<string, ShowtimeItem[]> = {};
            for (const showtime of showtimes) {
                const day = showtime.startTime.toISOString().slice(0, 10);
                if (!groups[day]) groups[day] = [];
                groups[day]!.push({
                    id: showtime.id,
                    startTime: showtime.startTime,
                    availableSeats: showtime.availableSeats,
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
