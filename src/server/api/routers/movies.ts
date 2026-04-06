import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

const INCLUDE_UNRELEASED_LOAD_TEST_HEADER = "x-load-test-include-unreleased";
const LOAD_TEST_MODE = process.env.LOAD_TEST_MODE === "true";

export const moviesRouter = createTRPCRouter({
    nowPlaying: publicProcedure
        .input(
            z.object({
                limit: z.number().int().positive().optional(),
            })
        )
        .query(async ({ input, ctx }) => {
            const limit = input.limit;
            const now = new Date();
            const includeUnreleased =
                LOAD_TEST_MODE &&
                ctx.headers
                    .get(INCLUDE_UNRELEASED_LOAD_TEST_HEADER)
                    ?.trim()
                    .toLowerCase() === "true";


            /**
             * Only return movies that still have an upcoming showtime. That
             * keeps old titles off pages where users expect to book tickets.
             */
            return db.movie.findMany({
                where: {
                    ...(includeUnreleased
                        ? {}
                        : {
                              releaseDate: {
                                  lte: now,
                              },
                          }),
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
