// @ts-nocheck
import { getRunConfig } from "../lib/config.js";
import {
    buildOptions,
    runScenario,
    runShowtimesByMovieScenario,
    setupScenario,
} from "../features/movie-showtime/scenario.js";

const config = getRunConfig();

export const options = buildOptions();

export function setup() {
    return setupScenario(config);
}

export function movieNowPlayingScenario(data) {
    runScenario(data);
}

export function movieShowtimesByMovieScenario(data) {
    runShowtimesByMovieScenario(data);
}
