// @ts-nocheck

import { getLoadProfile } from "../../lib/config.js";
import { check, group, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

const loadProfile = getLoadProfile("ORDER_HISTORY", {
    vus: 20,
    duration: "5m",
    gracefulStop: "30s",
    iterationSeconds: 12,
});

export function buildOptions() {
    const minimumRequestRate =
        (loadProfile.vus * 2) / loadProfile.iterationSeconds;

    return {
        discardResponseBodies: false,
        thresholds: {
            http_reqs: [`rate>=${minimumRequestRate.toFixed(2)}`],
            http_req_failed: ["rate<0.05"],
            bookings_list_success: ["rate>0.95"],
            cancel_booking_success: ["rate>0.95"],
        },
        scenarios: {
            order_history: {
                executor: "constant-vus",
                exec: "orderHistoryScenario",
                vus: loadProfile.vus,
                duration: loadProfile.duration,
                gracefulStop: loadProfile.gracefulStop,
            },
        },
    };
}


function buildLoadTestAuthHeaders(email) {
    return {
        "x-load-test-user-email": email,
    };
}

import { getRunConfig } from "../../lib/config.js";
import {
    getBookingsList,
    cancelBooking,
    parseTrpcJson,
    extractBookingId,
} from "./requests.js";

export const bookingsListSuccess = new Rate("bookings_list_success");
export const cancelBookingSuccess = new Rate("cancel_booking_success");

export const bookingsListDuration = new Trend("bookings_list_duration");
export const cancelBookingDuration = new Trend("cancel_booking_duration");


const ITERATION_PACING_SECONDS = 12;

export function runOrderHistoryScenario(data) {
    const config = getRunConfig();
    const emails = config.testUserEmails;
    const vuIndex = (__VU - 1) % emails.length;
    const email = emails[vuIndex];
    const headers = buildLoadTestAuthHeaders(email);
    const iterationStart = Date.now();

    let bookingId = null;

    group("bookings.list", () => {
        const res = getBookingsList(data.baseUrl, headers);

        const ok = check(res, {
            "bookings.list status is 200": (r) => r.status === 200,
            "bookings.list body exists": (r) => !!r.body,
        });

        bookingsListSuccess.add(ok);
        bookingsListDuration.add(res.timings.duration);

        if (!ok) return;

        const bookingsData = parseTrpcJson(res);

        const shapeOk = check(bookingsData, {
            "bookings.list returns array": (data) => Array.isArray(data),
            "bookings.list has at least one booking": (data) =>
                Array.isArray(data) && data.length > 0,
        });

        bookingsListSuccess.add(shapeOk);

        bookingId = extractBookingId(bookingsData);
    });

    if (bookingId) {
        group("bookings.cancel", () => {
            const res = cancelBooking(data.baseUrl, bookingId, headers);

            const ok = check(res, {
                "bookings.cancel status is 200": (r) => r.status === 200,
                "bookings.cancel body exists": (r) => !!r.body,
            });

            cancelBookingSuccess.add(ok);
            cancelBookingDuration.add(res.timings.duration);

            if (!ok) return;

            const cancelData = parseTrpcJson(res);

            const shapeOk = check(cancelData, {
                "bookings.cancel returned data": (data) => data !== null,
            });

            cancelBookingSuccess.add(shapeOk);
        });
    } else {
        cancelBookingSuccess.add(false);
    }

    const elapsedSeconds = (Date.now() - iterationStart) / 1000;
    const remaining = ITERATION_PACING_SECONDS - elapsedSeconds;

    if (remaining > 0) {
        sleep(remaining);
    }
}
