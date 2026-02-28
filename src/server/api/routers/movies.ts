import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "../trpc";
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
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ input }) => {
            const movie = await db.movie.findUnique({
                where: { id: input.id },
            });
            if (!movie) return null;
            return {
                id: movie.id,
                title: movie.title,
                genres: movie.genres,
                runtime: movie.runtime,
                posterUrl: movie.posterUrl,
                backdropUrl: movie.backdropUrl,
                languages: movie.languages,
                releaseDate: movie.releaseDate,
            };
        }),
});
