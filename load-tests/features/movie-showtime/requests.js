// @ts-nocheck
import { asNumber } from "../../lib/config.js";
import { trpcGet } from "../../lib/trpc.js";

function getNowPlayingInput() {
    const limit = asNumber(__ENV.NOW_PLAYING_LIMIT, NaN);
    return Number.isFinite(limit) && limit > 0 ? { limit } : {};
}

export function fetchNowPlaying(baseUrl) {
    return trpcGet(baseUrl, "movies.nowPlaying", getNowPlayingInput(), {
        tags: {
            area: "movie_showtime_selection",
            scenario: "now_playing",
            request_type: "read_get",
            endpoint: "movies.nowPlaying",
        },
    });
}

export function fetchShowtimesByMovie(baseUrl, movieId) {
    return trpcGet(
        baseUrl,
        "showtimes.getByMovie",
        { movieId },
        {
            tags: {
                area: "movie_showtime_selection",
                scenario: "showtimes_by_movie",
                request_type: "read_get",
                endpoint: "showtimes.getByMovie",
            },
        }
    );
}

export function getMovieIdFromNowPlayingResponse(response) {
    try {
        const movies = response.json("result.data.json");
        if (!Array.isArray(movies) || movies.length === 0) {
            return null;
        }

        const firstMovie = movies.find((movie) => movie?.id);
        return firstMovie?.id ?? null;
    } catch {
        return null;
    }
}
