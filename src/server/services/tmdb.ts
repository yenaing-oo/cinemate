import { z } from "zod";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;

export const NowPlayingResponseSchema = z.object({
    results: z.array(
        z.object({
            id: z.number(),
            title: z.string(),
            overview: z.string(),
            release_date: z.string(),
            poster_path: z.string().nullable(),
        })
    ),
    page: z.number(),
    total_pages: z.number(),
    total_results: z.number(),
});

export const MovieFullResponseSchema = z.object({
    overview: z.string(),
    release_date: z.string(),
    runtime: z.number().nullable(),
    vote_average: z.number().nullable(),
    backdrop_path: z.string().nullable(),
    genres: z.array(z.object({ name: z.string() })).nullable(),
    spoken_languages: z
        .array(z.object({ english_name: z.string() }))
        .nullable(),
    credits: z
        .object({
            cast: z.array(z.object({ name: z.string() })).nullable(),
            crew: z
                .array(z.object({ job: z.string(), name: z.string() }))
                .nullable(),
        })
        .nullable(),
    videos: z
        .object({
            results: z
                .array(
                    z.object({
                        site: z.string(),
                        type: z.string(),
                        key: z.string(),
                    })
                )
                .nullable(),
        })
        .nullable(),
});

export async function fetchNowPlaying(): Promise<
    z.infer<typeof NowPlayingResponseSchema>
> {
    const res = await fetch(
        // Use the Canada now-playing feed so the synced list matches this app's
        // market.
        `${TMDB_BASE_URL}/movie/now_playing?language=en-US&region=CA&page=1`,
        {
            headers: {
                Authorization: `Bearer ${TMDB_TOKEN}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!res.ok) {
        // Log the response body here because TMDB errors can be hard to debug
        // from the status code alone.
        const text = await res.text();
        console.error("TMDB STATUS:", res.status);
        console.error("TMDB RESPONSE:", text);
        throw new Error(`TMDB fetch failed: ${res.status}`);
    }

    const data: unknown = await res.json();

    return NowPlayingResponseSchema.parse(data);
}

export async function fetchMovieFull(
    tmdbId: number
): Promise<z.infer<typeof MovieFullResponseSchema>> {
    const res = await fetch(
        // Ask for credits and videos in one request so the sync job does not
        // need extra TMDB calls for the movie details page.
        `${TMDB_BASE_URL}/movie/${tmdbId}?append_to_response=credits%2Cvideos&language=en-US`,
        {
            headers: {
                Authorization: `Bearer ${TMDB_TOKEN}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!res.ok) {
        throw new Error(`TMDB details fetch failed for ${tmdbId}`);
    }

    const data: unknown = await res.json();
    return MovieFullResponseSchema.parse(data);
}
