// @ts-nocheck
import { check, group, sleep } from "k6";

import { getLoadProfile } from "../../lib/config.js";
import { signInTestUser } from "../../lib/supabase.js";
import {
    createBookingSession,
    fetchShowtimeSeats,
    getAvailableSeatIdsFromResponse,
    getSessionIdFromCreateResponse,
    goBackToSeatSelection,
    goToCheckout,
    setBookingTicketCount,
} from "./requests.js";

const loadProfile = getLoadProfile("BOOKING", {
    vus: 20,
    duration: "4m",
    gracefulStop: "30s",
    iterationSeconds: 12,
});

export function buildOptions() {
    const minimumRequestRate =
        (loadProfile.vus * 3) / loadProfile.iterationSeconds;

    return {
        discardResponseBodies: false,
        thresholds: {
            http_reqs: [`rate>=${minimumRequestRate.toFixed(2)}`],
            http_req_failed: ["rate<0.05"],
            http_req_duration: ["p(95)<2000"],
        },
        scenarios: {
            booking_checkout_review: {
                executor: "constant-vus",
                exec: "bookingScenario",
                vus: loadProfile.vus,
                duration: loadProfile.duration,
                gracefulStop: loadProfile.gracefulStop,
            },
        },
    };
}

function validateBookingConfig(config) {
    if (!config.showtimeId) {
        throw new Error("SHOWTIME_ID is required for the booking load test");
    }

    if (!config.hasSupabaseCredentials) {
        throw new Error(
            "Booking load test requires SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, TEST_USER_EMAILS, and TEST_USER_PASSWORD"
        );
    }

    if (config.testUserEmails.length < loadProfile.vus) {
        throw new Error(
            `Booking load test requires at least ${loadProfile.vus} TEST_USER_EMAILS`
        );
    }

    if (config.bookingTicketCount < 1) {
        throw new Error(
            "BOOKING_TICKET_COUNT must be a positive integer for the booking load test"
        );
    }
}

function buildAuthHeaders(authCookieHeader) {
    return {
        Cookie: authCookieHeader,
    };
}

export function setupScenario(config) {
    validateBookingConfig(config);

    console.log(`k6 baseUrl=${config.baseUrl}`);
    console.log(
        "Running booking baseline to checkout review: showtimeSeats.getByShowtime + bookingSession.update"
    );

    const users = config.testUserEmails
        .slice(0, loadProfile.vus)
        .map((email) => {
            const signedInUser = signInTestUser(config, email);
            const authHeaders = buildAuthHeaders(signedInUser.authCookieHeader);

            const createResponse = createBookingSession(
                config.baseUrl,
                config.showtimeId,
                authHeaders
            );
            const sessionId = getSessionIdFromCreateResponse(createResponse);

            check(createResponse, {
                "setup bookingSession.create status is 200": (r) =>
                    r.status === 200,
                "setup bookingSession.create returned session id": () =>
                    Boolean(sessionId),
            });

            if (!sessionId) {
                throw new Error(
                    `Unable to create booking session during setup for ${email}`
                );
            }

            const ticketCountResponse = setBookingTicketCount(
                config.baseUrl,
                sessionId,
                config.bookingTicketCount,
                authHeaders
            );

            check(ticketCountResponse, {
                "setup bookingSession.update ticket count status is 200": (r) =>
                    r.status === 200,
            });

            if (ticketCountResponse.status !== 200) {
                throw new Error(
                    `Unable to move booking session to seat selection during setup for ${email}`
                );
            }

            return {
                email,
                sessionId,
                authCookieHeader: signedInUser.authCookieHeader,
            };
        });

    return {
        ...config,
        loadProfile,
        users,
    };
}

function getAssignedUser(data) {
    return data.users[(__VU - 1) % data.users.length];
}

export function runScenario(data) {
    const iterationStartMs = Date.now();
    const assignedUser = getAssignedUser(data);
    const authHeaders = buildAuthHeaders(assignedUser.authCookieHeader);
    const rotationOffset = __VU - 1 + __ITER;

    let selectedSeatIds = [];

    group("Seat Map Lookup", () => {
        const showtimeSeats = fetchShowtimeSeats(
            data.baseUrl,
            data.showtimeId,
            authHeaders
        );

        selectedSeatIds = getAvailableSeatIdsFromResponse(
            showtimeSeats,
            data.bookingTicketCount,
            rotationOffset
        );

        check(showtimeSeats, {
            "showtimeSeats.getByShowtime GET status is 200": (r) =>
                r.status === 200,
            "showtimeSeats.getByShowtime response has trpc payload": (r) => {
                try {
                    return Array.isArray(r.json("result.data.json"));
                } catch {
                    return false;
                }
            },
            "showtimeSeats.getByShowtime has enough available seats": () =>
                selectedSeatIds.length === data.bookingTicketCount,
        });
    });

    if (selectedSeatIds.length !== data.bookingTicketCount) {
        throw new Error(
            `Unable to select ${data.bookingTicketCount} seats for ${assignedUser.email}`
        );
    }

    group("Checkout Transition", () => {
        const checkoutTransition = goToCheckout(
            data.baseUrl,
            assignedUser.sessionId,
            selectedSeatIds,
            authHeaders
        );

        check(checkoutTransition, {
            "bookingSession.update CHECKOUT status is 200": (r) =>
                r.status === 200,
        });

        if (checkoutTransition.status !== 200) {
            throw new Error(
                `Unable to move booking session to checkout for ${assignedUser.email}`
            );
        }
    });

    group("Return To Seat Selection", () => {
        const rewindTransition = goBackToSeatSelection(
            data.baseUrl,
            assignedUser.sessionId,
            authHeaders
        );

        check(rewindTransition, {
            "bookingSession.update SEAT_SELECTION status is 200": (r) =>
                r.status === 200,
        });

        if (rewindTransition.status !== 200) {
            throw new Error(
                `Unable to rewind booking session after checkout for ${assignedUser.email}`
            );
        }
    });

    const targetIterationSeconds = data.loadProfile.iterationSeconds;
    const elapsedSeconds = (Date.now() - iterationStartMs) / 1000;
    const remainingSleepSeconds = Math.max(
        0,
        targetIterationSeconds - elapsedSeconds
    );

    sleep(remainingSleepSeconds);
}
