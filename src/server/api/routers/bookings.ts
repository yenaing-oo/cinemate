import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const bookingsRouter = createTRPCRouter({
    myHistory: protectedProcedure.query(async ({ ctx }) => {
        const movies = await ctx.db.movie.findMany({
            take: 3,
            select: {
                id: true,
                title: true,
                posterUrl: true,
            },
        });

        // map into "booking-like" objects
        const bookings = movies.map((movie, index) => ({
            id: `booking-${movie.id}`,
            movieTitle: movie.title,
            posterUrl: movie.posterUrl,
            showtime: new Date(Date.now() + (index + 1) * 86400000),
            seats: ["A5", "A6", "A7"], // hardcoded for now
        }));

        return { items: bookings };
    }),
});
