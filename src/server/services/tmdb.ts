const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_TOKEN = process.env.TMDB_ACCESS_TOKEN;

export async function fetchNowPlaying() {
    console.log("TMDB token starts with:", TMDB_TOKEN?.slice(0, 10));

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

    return res.json();
}

export async function fetchMovieFull(tmdbId: number) {
    console.log(tmdbId);
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

    return res.json();
}
