import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const showtimeRouter = createTRPCRouter({

  // ===============================
  // Get all unique available dates
  // ===============================
  getAvailableDates: publicProcedure.query(async ({ ctx }) => {

    const showtimes = await ctx.db.showtime.findMany({
      select: {
        startTime: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    // Extract unique YYYY-MM-DD dates
    const uniqueDates = [
      ...new Set(
        showtimes.map((showtime: { startTime: { toISOString: () => string; }; }) =>
          showtime.startTime.toISOString().split("T")[0]
        )
      ),
    ];

    return uniqueDates;

  }),

  // =====================================
  // Get showtimes for specific movie/date
  // =====================================
  getShowtimesByMovieAndDate: publicProcedure
    .input(
      z.object({
        movieId: z.string(),
        date: z.string(), // format: YYYY-MM-DD
      })
    )
    .query(async ({ ctx, input }) => {

      const startOfDay = new Date(input.date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(input.date);
      endOfDay.setHours(23, 59, 59, 999);

      const showtimes = await ctx.db.showtime.findMany({

        where: {
          movieId: input.movieId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },

        include: {
          movie: {
            select: {
              id: true,
              title: true,
              posterUrl: true,
              runtime: true,
            },
          },
        },

        orderBy: {
          startTime: "asc",
        },

      });

      return showtimes;

    }),

  // =====================================
  // Get single showtime (for seat selection)
  // =====================================
  getShowtimeById: publicProcedure
    .input(
      z.object({
        showtimeId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {

      const showtime = await ctx.db.showtime.findUnique({

        where: {
          id: input.showtimeId,
        },

        include: {

          movie: true,

          showtimeSeats: {
            include: {
              seat: true,
            },
            orderBy: [
              { seat: { row: "asc" } },
              { seat: { number: "asc" } },
            ],
          },

        },

      });

      return showtime;

    }),

});
