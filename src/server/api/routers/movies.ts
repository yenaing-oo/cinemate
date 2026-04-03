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
                    id: true,
                    title: true,
                    description: true,
                    genres: true,
                    runtime: true,
                    posterUrl: true,
                    backdropUrl: true,
                },
                orderBy: { releaseDate: "desc" },
                ...(typeof limit === "number" ? { take: limit } : {}),
            });
        }),
});
