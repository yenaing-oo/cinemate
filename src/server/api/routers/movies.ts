import { createTRPCRouter, publicProcedure } from "../trpc";
import { db } from "~/server/db";
import {
    fetchNowPlaying,
    fetchMovieDetails,
    fetchMovieCredits,
    fetchMovieVideos,
} from "~/server/services/tmdb";

export const moviesRouter = createTRPCRouter({
    saveNowPlaying: publicProcedure.mutation(async () => {
        const movies = (await fetchNowPlaying()).results.slice(0, 10);

        for (const movie of movies) {
            await db.movie.upsert({
                where: { tmdbId: movie.id },
                create: {
                    tmdbId: movie.id,
                    title: movie.title,
                    posterUrl: movie.poster_path,
                },
                update: {
                    title: movie.title,
                    posterUrl: movie.poster_path,
                },
            });

            console.log(
                `Saved: ${movie.id} | ${movie.title} | ${movie.poster_path}`
            );
        }

        return { saved: movies.length };
    }),

    repopulateMovieDetails: publicProcedure.mutation(async () => {
        const movies = await db.movie.findMany({
            select: { tmdbId: true },
        });

        console.log(`Found ${movies.length} movies`);

        for (const movie of movies) {
            const tmdbId = movie.tmdbId;

            const details = await fetchMovieDetails(tmdbId);
            const credits = await fetchMovieCredits(tmdbId);
            const videos = await fetchMovieVideos(tmdbId);

            const trailer = videos.results?.find(
                (v: any) => v.site === "YouTube" && v.type === "Trailer"
            );

            const trailerUrl = trailer
                ? `https://www.youtube.com/watch?v=${trailer.key}`
                : null;

            const cast =
                credits.cast
                    ?.slice(0, 5)
                    .map((c: any) => c.name)
                    .join(", ") || null;

            const director =
                credits.crew
                    ?.filter((c: any) => c.job === "Director")
                    .map((d: any) => d.name)
                    .join(", ") || null;

            await db.movie.update({
                where: { tmdbId },
                data: {
                    description: details.overview ?? null,
                    releaseDate: details.release_date
                        ? new Date(details.release_date)
                        : null,
                    runtime: details.runtime ?? null,
                    rating: details.vote_average ?? null,
                    backdropUrl: details.backdrop_path
                        ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
                        : null,
                    genres:
                        details.genres?.map((g: any) => g.name).join(", ") ||
                        null,
                    languages:
                        details.spoken_languages
                            ?.map((l: any) => l.english_name)
                            .join(", ") || null,
                    cast,
                    directors: director,
                    trailerUrl,
                },
            });

            console.log(`Updated movie ${tmdbId}`);
        }

        return { updated: movies.length };
    }),
});
