import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const bookingsRouter = createTRPCRouter({
    myHistory: protectedProcedure.query(async ({ ctx }) => {
        const movies = await ctx.db.booking.findMany({
            where: { userId: ctx.user.id },
            orderBy: { createdAt: "desc" },
            include: {
                showtime: {
                    select: {
                        startTime: true,
                        movie: {
                            select: {
                                id: true,
                                title: true,
                                posterUrl: true,
                            },
                        },
                    },
                },
                tickets: {
                    select: {
                        seat: {
                            select: {
                                row: true,
                                number: true,
                            },
                        }
                    }
                }
            },
        });

        return { items: movies.map((b) => ({
            id: b.id,
            status: b.status,
            movieTitle: b.showtime.movie.title,
            posterUrl: b.showtime.movie.posterUrl,
            showtime: b.showtime.startTime,
            seats: b.tickets
                    .map((t) => `${t.seat.row}${t.seat.number}`)
                    .sort(),
        })),
     };
    }),
});
