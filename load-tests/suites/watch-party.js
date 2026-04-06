// @ts-nocheck
import { getRunConfig } from "../lib/config.js";
import {
    buildOptions,
    runScenario,
    setupScenario,
} from "../features/watch-party/scenario.js";

const config = getRunConfig();

export const options = buildOptions();

export function setup() {
    return setupScenario(config);
}

export function watchPartyScenario(data) {
    runScenario(data);
}
