import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const moviesRouter = createTRPCRouter({
    nowPlaying: publicProcedure
        .input(
            z.object({
                limit: z.number().int().positive().optional(),
            })
        )
        .query(async ({ input }) => {
            const limit = input.limit;
            const now = new Date();

            /**
             * Only return movies that still have an upcoming showtime. That
             * keeps old titles off pages where users expect to book tickets.
             */
            return db.movie.findMany({
                where: {
                    showtimes: {
                        some: {
                            startTime: {
                                gte: now,
                            },
                        },
                    },
                },
                select: {
                    // Only send the fields the movie pages actually use.
                    id: true,
                    title: true,
                    description: true,
                    genres: true,
                    runtime: true,
                    posterUrl: true,
                    backdropUrl: true,
                },
                // Newer releases go first in the now playing views.
                orderBy: { releaseDate: "desc" },
                // Some pages need the full list, but the home page only needs a
                // short slice.
                ...(typeof limit === "number" ? { take: limit } : {}),
            });
        }),
});
