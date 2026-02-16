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
            return db.movie.findMany({
                select: {
                    id: true,
                    title: true,
                    genres: true,
                    runtime: true,
                    posterUrl: true,
                },
                orderBy: { releaseDate: "desc" },
                ...(typeof limit === "number" ? { take: limit } : {}),
            });
        }),
});
