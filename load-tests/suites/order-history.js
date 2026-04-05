// @ts-nocheck
import {
    runOrderHistoryScenario,
    buildOptions,
} from "../features/order-history/scenario.js";

export const options = buildOptions();

export function setup() {
    console.log(
        "Starting Feature 2 load test: bookings.list + bookings.latestBookingDetails"
    );

    return {
        baseUrl: __ENV.BASE_URL || "http://localhost:3000",
    };
}

export function orderHistoryScenario(data) {
    runOrderHistoryScenario(data);
}
