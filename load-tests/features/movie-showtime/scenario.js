// @ts-nocheck
import { check, group, sleep } from "k6";

import { asNumber } from "../../lib/config.js";
import { fetchNowPlaying } from "./requests.js";

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
                vus: asNumber(__ENV.LOAD_VUS, 20),
                duration: __ENV.LOAD_DURATION ?? "5m",
                gracefulStop: __ENV.LOAD_GRACEFUL_STOP ?? "30s",
            },
        },
    };
}

export function setupScenario(config) {
    console.log(`k6 baseUrl=${config.baseUrl}`);
    console.log("Running movie/showtime selection baseline: movies.nowPlaying");
    return config;
}

export function runScenario(data) {
    group("Movie and Showtime Selection (nowPlaying)", () => {
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

        sleep(data.sleepSeconds);
    });
}
