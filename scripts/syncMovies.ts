import "dotenv/config";
import { db } from "../src/server/db";
import { fetchNowPlaying, fetchMovieFull } from "../src/server/services/tmdb";

async function main() {
    const nowPlaying = (await fetchNowPlaying()).results.slice(0, 10);

    const rows = [];

    for (const m of nowPlaying) {
        const full = await fetchMovieFull(m.id);

        const trailer = full.videos?.results?.find(
            (v: any) => v.site === "YouTube" && v.type === "Trailer"
        );

        const trailerUrl = trailer
            ? `https://www.youtube.com/watch?v=${trailer.key}`
            : null;

        const cast =
            full.credits?.cast
                ?.slice(0, 5)
                .map((c: any) => c.name)
                .join(", ") ?? null;

        const director =
            full.credits?.crew?.find((c: any) => c.job === "Director")?.name ??
            null;

        rows.push({
            tmdbId: m.id,
            title: m.title,
            posterUrl: m.poster_path
                ? `https://image.tmdb.org/t/p/w1280${m.poster_path}`
                : null,
            description: full.overview ?? null,
            releaseDate: full.release_date
                ? new Date(full.release_date)
                : new Date(),
            runtime: full.runtime ?? 0,
            rating: full.vote_average ?? null,
            backdropUrl: full.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${full.backdrop_path}`
                : null,
            genres: full.genres?.map((g: any) => g.name).join(", ") ?? null,
            languages:
                full.spoken_languages
                    ?.map((l: any) => l.english_name)
                    .join(", ") ?? null,
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
        console.error("❌ Sync failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await db.$disconnect();
    });
