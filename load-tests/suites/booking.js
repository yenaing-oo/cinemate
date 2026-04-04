// @ts-nocheck
import { getRunConfig } from "../lib/config.js";
import {
    buildOptions,
    runScenario,
    setupScenario,
} from "../features/booking/scenario.js";

const config = getRunConfig();

export const options = buildOptions();

export function setup() {
    return setupScenario(config);
}

export function bookingScenario(data) {
    runScenario(data);
}
