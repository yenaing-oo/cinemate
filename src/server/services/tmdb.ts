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
    console.log("Fetching now playing movies");
    const res = await fetch(
        `${TMDB_BASE_URL}/movie/now_playing?language=en-US&region=CA&page=1`,
        {
            headers: {
                Authorization: `Bearer ${TMDB_TOKEN}`,
                "Content-Type": "application/json",
            },
        }
    );

    if (!res.ok) {
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
    console.log("Fetching details for TMDB ID:", tmdbId);
    const res = await fetch(
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
