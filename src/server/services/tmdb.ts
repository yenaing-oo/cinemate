const TMDB_BASE_URL = process.env.TMDB_BASE_URL;
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

export async function fetchMovieDetails(tmdbId: number) {
    console.log(tmdbId);
    const res = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}`, {
        headers: {
            Authorization: `Bearer ${TMDB_TOKEN}`,
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`TMDB details fetch failed for ${tmdbId}`);
    }

    return res.json();
}

export async function fetchMovieCredits(tmdbId: number) {
    console.log(tmdbId);
    const res = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/credits`, {
        headers: {
            Authorization: `Bearer ${TMDB_TOKEN}`,
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`TMDB credits fetch failed for ${tmdbId}`);
    }

    return res.json();
}

export async function fetchMovieVideos(tmdbId: number) {
    console.log(tmdbId);
    const res = await fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/videos`, {
        headers: {
            Authorization: `Bearer ${TMDB_TOKEN}`,
            "Content-Type": "application/json",
        },
    });

    if (!res.ok) {
        throw new Error(`TMDB credits fetch failed for ${tmdbId}`);
    }

    return res.json();
}
