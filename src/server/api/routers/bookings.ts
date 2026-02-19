import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const bookingsRouter = createTRPCRouter({
    myHistory: publicProcedure.query(async ({ ctx }) => {
        const movies = await ctx.db.movie.findMany({
            take: 3,
            select: { id: true, title: true, posterUrl: true },
        });

        const bookings = movies.map((movie, index) => {
            const showtime = new Date();
            showtime.setDate(showtime.getDate());
            showtime.setHours(18 + index, 20, 0, 0); // 6:20 PM, 7:20 PM...

            return {
                id: `booking-${movie.id}`,
                movieTitle: movie.title,
                posterUrl: movie.posterUrl,
                showtime,
                seats: ["A5", "A6", "A7"],
            };
        });

        return { items: bookings }; 
    }),
});
