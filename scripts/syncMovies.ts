import "dotenv/config";
import { db } from "../src/server/db";
import {
    fetchNowPlaying,
    fetchMovieFull,
    type NowPlayingResponseSchema,
    type MovieFullResponseSchema,
} from "../src/server/services/tmdb";
import type { z } from "zod";

const MOVIES_FETCH_LIMIT = 10;
const TOP_CAST_COUNT = 5;
const TMDB_POSTER_SIZE = "w500";
const TMDB_BACKDROP_SIZE = "w1280";

async function main() {
    const nowPlayingResponse = await fetchNowPlaying();
    const nowPlaying: z.infer<typeof NowPlayingResponseSchema>["results"] =
        nowPlayingResponse.results.slice(0, MOVIES_FETCH_LIMIT);

    const rows = [];

    for (const m of nowPlaying) {
        const full: z.infer<typeof MovieFullResponseSchema> =
            await fetchMovieFull(m.id);

        const trailer = full.videos?.results?.find(
            (v) => v.site === "YouTube" && v.type === "Trailer"
        );

        const trailerUrl = trailer
            ? `https://www.youtube.com/watch?v=${trailer.key}`
            : null;

        const cast =
            full.credits?.cast
                ?.slice(0, TOP_CAST_COUNT)
                .map((c) => c.name)
                .join(", ") ?? null;

        const director =
            full.credits?.crew?.find((c) => c.job === "Director")?.name ?? null;

        rows.push({
            tmdbId: m.id,
            title: m.title,
            posterUrl: m.poster_path
                ? `https://image.tmdb.org/t/p/${TMDB_POSTER_SIZE}${m.poster_path}`
                : null,
            description: full.overview ?? null,
            releaseDate: full.release_date
                ? new Date(full.release_date)
                : new Date(),
            runtime: full.runtime ?? 0,
            rating: full.vote_average ?? null,
            backdropUrl: full.backdrop_path
                ? `https://image.tmdb.org/t/p/${TMDB_BACKDROP_SIZE}${full.backdrop_path}`
                : null,
            genres: full.genres?.map((g) => g.name).join(", ") ?? null,
            languages:
                full.spoken_languages?.map((l) => l.english_name).join(", ") ??
                null,
            cast,
            directors: director,
            trailerUrl,
        });
    }

    await db.$transaction(
        rows.map((row) =>
            db.movie.upsert({
                where: { tmdbId: row.tmdbId },
                create: row,
                update: row,
            })
        )
    );

    console.log(`Synced ${rows.length} movies`);
}

main()
    .catch((e) => {
        console.error("Sync failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
