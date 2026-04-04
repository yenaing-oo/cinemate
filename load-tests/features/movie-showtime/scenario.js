// @ts-nocheck
import { check, group, sleep } from "k6";

import { asNumber } from "../../lib/config.js";

import {
    fetchNowPlaying,
    fetchShowtimesByMovie,
    getMovieIdFromNowPlayingResponse,
} from "./requests.js";

export function buildOptions() {
    return {
        discardResponseBodies: false,
        thresholds: {
            http_reqs: ["rate>=3.33"],
            http_req_failed: ["rate<0.05"],
            http_req_duration: ["p(95)<1500"],
        },
        scenarios: {
            movie_showtime_selection: {
                executor: "constant-vus",
                exec: "movieShowtimeScenario",
                vus: 20,
                duration: "5m",
                gracefulStop: "30s",
            },
        },
    };
}

export function setupScenario(config) {
    console.log(`k6 baseUrl=${config.baseUrl}`);

    const nowPlaying = fetchNowPlaying(config.baseUrl);
    const movieId = getMovieIdFromNowPlayingResponse(nowPlaying);

    check(nowPlaying, {
        "setup nowPlaying GET status is 200": (r) => r.status === 200,
        "setup nowPlaying returned a movie id": () => Boolean(movieId),
    });

    if (!movieId) {
        throw new Error(
            "Unable to resolve movieId from movies.nowPlaying during setup"
        );
    }

    console.log(
        "Running movie/showtime selection baseline: movies.nowPlaying + showtimes.getByMovie"
    );

    return {
        ...config,
        movieId,
    };
}

export function runScenario(data) {
    const iterationStartMs = Date.now();

    group("Now Playing Lookup", () => {
        const nowPlaying = fetchNowPlaying(data.baseUrl);

        check(nowPlaying, {
            "nowPlaying GET status is 200": (r) => r.status === 200,
            "nowPlaying GET response has trpc payload": (r) => {
                try {
                    return Array.isArray(r.json("result.data.json"));
                } catch {
                    return false;
                }
            },
        });
    });

    group("Movie Showtime Lookup", () => {
        const showtimesByMovie = fetchShowtimesByMovie(
            data.baseUrl,
            data.movieId
        );

        check(showtimesByMovie, {
            "showtimes.getByMovie GET status is 200": (r) => r.status === 200,
            "showtimes.getByMovie response has trpc payload": (r) => {
                try {
                    const payload = r.json("result.data.json");
                    return payload === null || typeof payload === "object";
                } catch {
                    return false;
                }
            },
        });
    });

    // 20 VUs * 2 requests/iteration * (60 / 12s) ~= 200 requests/min total.
    const targetIterationSeconds = asNumber(__ENV.ITERATION_SECONDS, 12);
    const elapsedSeconds = (Date.now() - iterationStartMs) / 1000;
    const remainingSleepSeconds = Math.max(
        0,
        targetIterationSeconds - elapsedSeconds
    );

    sleep(remainingSleepSeconds);
}
