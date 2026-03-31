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
