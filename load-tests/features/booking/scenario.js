// @ts-nocheck
import { check, group, sleep } from "k6";

import { getLoadProfile } from "../../lib/config.js";
import {
    fetchNowPlaying,
    fetchShowtimesByMovie,
} from "../movie-showtime/requests.js";
import {
    createBookingSession,
    fetchShowtimeSeats,
    getAvailableSeatIdsFromResponse,
    getResponseErrorMessage,
    getSessionIdFromCreateResponse,
    goBackToSeatSelection,
    goToCheckout,
    setBookingTicketCount,
} from "./requests.js";

const loadProfile = getLoadProfile("BOOKING", {
    vus: 20,
    duration: "5m",
    gracefulStop: "30s",
    iterationSeconds: 12,
});

const BOOKING_SESSION_REFRESH_MS = 4 * 60 * 1000;
const LOAD_TEST_USER_EMAIL_HEADER = "x-load-test-user-email";
const LOAD_TEST_SECRET_HEADER = "x-load-test-secret";
let assignedUserState = null;

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
    if (!config.loadTestMode && !config.loadTestSecret) {
        throw new Error(
            "Booking load test requires either LOAD_TEST_MODE=true for local runs or LOAD_TEST_SECRET for the runtime-switch flow in staging/production."
        );
    }

    if (config.testUserEmails.length < loadProfile.vus) {
        throw new Error(
            `Booking load test requires at least ${loadProfile.vus} seeded booking users. Set TEST_USER_EMAILS explicitly or let BOOKING_USER_EMAIL_PREFIX/BOOKING_USER_EMAIL_DOMAIN generate them.`
        );
    }

    if (config.bookingTicketCount < 1) {
        throw new Error(
            "BOOKING_TICKET_COUNT must be a positive integer for the booking load test"
        );
    }
}

function buildLoadTestAuthHeaders(email, config) {
    const headers = {
        [LOAD_TEST_USER_EMAIL_HEADER]: email,
    };

    if (config.loadTestSecret) {
        headers[LOAD_TEST_SECRET_HEADER] = config.loadTestSecret;
    }

    return headers;
}

function prepareUserSession(data, email) {
    const authHeaders = buildLoadTestAuthHeaders(email, data);

    const createResponse = createBookingSession(
        data.baseUrl,
        data.showtimeId,
        authHeaders
    );
    const sessionId = getSessionIdFromCreateResponse(createResponse);
    const createErrorMessage = getResponseErrorMessage(createResponse);

    check(createResponse, {
        "bookingSession.create status is 200": (r) => r.status === 200,
        "bookingSession.create returned session id": () => Boolean(sessionId),
    });

    if (createResponse.status !== 200 || !sessionId) {
        throw new Error(
            `Unable to create booking session for ${email}: ${
                createErrorMessage ?? `status ${createResponse.status}`
            }`
        );
    }

    const ticketCountResponse = setBookingTicketCount(
        data.baseUrl,
        sessionId,
        data.bookingTicketCount,
        authHeaders
    );
    const ticketCountErrorMessage =
        getResponseErrorMessage(ticketCountResponse);

    check(ticketCountResponse, {
        "bookingSession.update ticket count status is 200": (r) =>
            r.status === 200,
    });

    if (ticketCountResponse.status !== 200) {
        throw new Error(
            `Unable to move booking session to seat selection for ${email}: ${
                ticketCountErrorMessage ??
                `status ${ticketCountResponse.status}`
            }`
        );
    }

    return {
        email,
        sessionId,
        authHeaders,
        excludedSeatIds: [],
        partitionIndex: (__VU - 1) % loadProfile.vus,
        sessionPreparedAtMs: Date.now(),
    };
}

function isSeatContentionError(message) {
    return Boolean(
        message?.includes("Some selected seats are no longer available")
    );
}

function isRecoverableSessionError(message) {
    return Boolean(
        message?.includes("Session has expired") ||
        message?.includes("Session not found") ||
        message?.includes("No record was found for a query") ||
        message?.includes("findUniqueOrThrow") ||
        message?.includes(
            "depends on one or more records that were required but not found"
        ) ||
        message?.includes("Invalid step transition") ||
        message?.includes("UNAUTHORIZED") ||
        message?.includes("Unauthorized")
    );
}

function getUnauthorizedSetupMessage(email, response) {
    const errorMessage = getResponseErrorMessage(response);
    return `showtimeSeats.getByShowtime returned UNAUTHORIZED for ${email}. For local runs, start the app with pnpm dev:loadtest. For staging/production, configure LOAD_TEST_SECRET on the app and in load-tests/.env, enable the Supabase runtime flag load_test_auth_enabled, and ensure the seeded booking user exists. ${
        errorMessage ? `Server message: ${errorMessage}` : ""
    }`.trim();
}

function shouldRefreshSession(state) {
    return (
        !state ||
        Date.now() - state.sessionPreparedAtMs >= BOOKING_SESSION_REFRESH_MS
    );
}

function lookupSeatIds(data, state, rotationOffset) {
    const seatLookup = fetchShowtimeSeats(
        data.baseUrl,
        data.showtimeId,
        state.authHeaders
    );

    if (seatLookup.status === 401) {
        throw new Error(getUnauthorizedSetupMessage(state.email, seatLookup));
    }

    const selectedSeatIds = getAvailableSeatIdsFromResponse(
        seatLookup,
        data.bookingTicketCount,
        {
            excludedSeatIds: state.excludedSeatIds ?? [],
            partitionCount: loadProfile.vus,
            partitionIndex: state.partitionIndex,
            rotationOffset,
        }
    );

    check(seatLookup, {
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

    if (selectedSeatIds.length !== data.bookingTicketCount) {
        throw new Error(
            `Unable to select ${data.bookingTicketCount} seats for ${state.email}`
        );
    }

    return selectedSeatIds;
}

function attemptCheckoutTransition(
    data,
    state,
    selectedSeatIds,
    rotationOffset
) {
    let checkoutTransition = goToCheckout(
        data.baseUrl,
        state.sessionId,
        selectedSeatIds,
        state.authHeaders
    );
    let checkoutErrorMessage = getResponseErrorMessage(checkoutTransition);

    if (
        checkoutTransition.status !== 200 &&
        isSeatContentionError(checkoutErrorMessage)
    ) {
        state.excludedSeatIds = selectedSeatIds;
        const retrySeatIds = lookupSeatIds(
            data,
            state,
            rotationOffset + loadProfile.vus
        );

        checkoutTransition = goToCheckout(
            data.baseUrl,
            state.sessionId,
            retrySeatIds,
            state.authHeaders
        );
        checkoutErrorMessage = getResponseErrorMessage(checkoutTransition);
        state.excludedSeatIds = [];
    }

    return {
        checkoutTransition,
        checkoutErrorMessage,
    };
}

function getMoviesFromNowPlayingResponse(response) {
    try {
        const movies = response.json("result.data.json");
        return Array.isArray(movies) ? movies.filter((movie) => movie?.id) : [];
    } catch {
        return [];
    }
}

function getShowtimesFromResponse(response) {
    try {
        const showtimes = response.json("result.data.json.showtimes");
        return Array.isArray(showtimes)
            ? showtimes.filter((showtime) => showtime?.id)
            : [];
    } catch {
        return [];
    }
}

function getAvailableSeatCountFromResponse(response) {
    try {
        const seats = response.json("result.data.json");

        if (!Array.isArray(seats)) {
            return 0;
        }

        return seats.filter((seat) => seat?.id && !seat?.isBooked).length;
    } catch {
        return 0;
    }
}

function getRequiredSeatCapacity(config) {
    return Math.max(
        config.bookingTicketCount,
        loadProfile.vus * config.bookingTicketCount
    );
}

function resolveShowtime(config) {
    const requiredSeatCapacity = getRequiredSeatCapacity(config);
    const authHeaders = buildLoadTestAuthHeaders(config.testUserEmails[0], config);
    const nowPlayingResponse = fetchNowPlaying(config.baseUrl);
    const movies = getMoviesFromNowPlayingResponse(nowPlayingResponse);

    if (nowPlayingResponse.status !== 200 || movies.length === 0) {
        throw new Error(
            "Unable to auto-resolve a booking showtime from movies.nowPlaying"
        );
    }

    let bestCandidate = null;

    for (const movie of movies) {
        const showtimesResponse = fetchShowtimesByMovie(
            config.baseUrl,
            movie.id
        );
        const showtimes = getShowtimesFromResponse(showtimesResponse);

        if (showtimesResponse.status !== 200 || showtimes.length === 0) {
            continue;
        }

        for (const showtime of showtimes) {
            const seatLookup = fetchShowtimeSeats(
                config.baseUrl,
                showtime.id,
                authHeaders
            );

            if (seatLookup.status === 401) {
                throw new Error(
                    getUnauthorizedSetupMessage(
                        config.testUserEmails[0],
                        seatLookup
                    )
                );
            }

            const availableSeatCount =
                getAvailableSeatCountFromResponse(seatLookup);

            if (seatLookup.status !== 200) {
                continue;
            }

            const candidate = {
                source: "auto",
                showtimeId: showtime.id,
                movieTitle: movie.title ?? movie.id,
                startTime: showtime.startTime ?? null,
                availableSeatCount,
            };

            if (availableSeatCount >= requiredSeatCapacity) {
                return candidate;
            }

            if (
                availableSeatCount >= config.bookingTicketCount &&
                (!bestCandidate ||
                    availableSeatCount > bestCandidate.availableSeatCount)
            ) {
                bestCandidate = candidate;
            }
        }
    }

    if (bestCandidate) {
        throw new Error(
            `Unable to auto-resolve a showtime with at least ${requiredSeatCapacity} available seats. Best candidate ${bestCandidate.showtimeId} (${bestCandidate.movieTitle}) had ${bestCandidate.availableSeatCount}. Seed more seats or reduce the booking load.`
        );
    }

    throw new Error(
        "Unable to auto-resolve a booking showtime from now-playing movies with future showtimes"
    );
}

export function setupScenario(config) {
    validateBookingConfig(config);
    const showtimeResolution = resolveShowtime(config);
    const resolvedConfig = {
        ...config,
        showtimeId: showtimeResolution.showtimeId,
        showtimeResolution,
    };

    console.log(`k6 baseUrl=${resolvedConfig.baseUrl}`);
    console.log(
        "Running booking baseline to checkout review: showtimeSeats.getByShowtime + bookingSession.update"
    );
    console.log(
        `Auto-resolved booking showtimeId=${showtimeResolution.showtimeId} movie="${showtimeResolution.movieTitle}" startTime=${showtimeResolution.startTime} availableSeats=${showtimeResolution.availableSeatCount}`
    );

    return {
        ...resolvedConfig,
        loadProfile,
    };
}

function getAssignedUserEmail(data) {
    return data.testUserEmails[(__VU - 1) % loadProfile.vus];
}

function getAssignedUser(data) {
    const email = getAssignedUserEmail(data);

    if (!assignedUserState || assignedUserState.email !== email) {
        assignedUserState = prepareUserSession(data, email);
    } else if (shouldRefreshSession(assignedUserState)) {
        assignedUserState = prepareUserSession(data, email);
    }

    return assignedUserState;
}

function runBookingCycle(data, state, rotationOffset) {
    state.excludedSeatIds = [];
    let selectedSeatIds = [];

    group("Seat Map Lookup", () => {
        selectedSeatIds = lookupSeatIds(data, state, rotationOffset);
    });

    const checkoutResult = group("Checkout Transition", () => {
        const { checkoutTransition, checkoutErrorMessage } =
            attemptCheckoutTransition(
                data,
                state,
                selectedSeatIds,
                rotationOffset
            );

        check(checkoutTransition, {
            "bookingSession.update CHECKOUT status is 200": (r) =>
                r.status === 200,
        });

        return {
            response: checkoutTransition,
            errorMessage: checkoutErrorMessage,
        };
    });

    if (checkoutResult.response.status !== 200) {
        return {
            ok: false,
            label: "move booking session to checkout",
            errorMessage: checkoutResult.errorMessage,
            status: checkoutResult.response.status,
        };
    }

    const rewindResult = group("Return To Seat Selection", () => {
        const rewindTransition = goBackToSeatSelection(
            data.baseUrl,
            state.sessionId,
            state.authHeaders
        );
        const rewindErrorMessage = getResponseErrorMessage(rewindTransition);

        check(rewindTransition, {
            "bookingSession.update SEAT_SELECTION status is 200": (r) =>
                r.status === 200,
        });

        return {
            response: rewindTransition,
            errorMessage: rewindErrorMessage,
        };
    });

    if (rewindResult.response.status !== 200) {
        return {
            ok: false,
            label: "rewind booking session after checkout",
            errorMessage: rewindResult.errorMessage,
            status: rewindResult.response.status,
        };
    }

    return { ok: true };
}

export function runScenario(data) {
    const iterationStartMs = Date.now();
    const rotationOffset = __VU - 1 + __ITER;
    let state = getAssignedUser(data);
    let cycleResult = runBookingCycle(data, state, rotationOffset);
    let recoveryAttempts = 0;

    while (
        !cycleResult.ok &&
        isRecoverableSessionError(cycleResult.errorMessage) &&
        recoveryAttempts < 2
    ) {
        recoveryAttempts += 1;
        assignedUserState = prepareUserSession(data, state.email);
        state = assignedUserState;
        cycleResult = runBookingCycle(
            data,
            state,
            rotationOffset + loadProfile.vus * recoveryAttempts
        );
    }

    if (!cycleResult.ok) {
        throw new Error(
            `Unable to ${cycleResult.label} for ${state.email}: ${
                cycleResult.errorMessage ?? `status ${cycleResult.status}`
            }`
        );
    }

    const targetIterationSeconds = data.loadProfile.iterationSeconds;
    const elapsedSeconds = (Date.now() - iterationStartMs) / 1000;
    const remainingSleepSeconds = Math.max(
        0,
        targetIterationSeconds - elapsedSeconds
    );

    sleep(remainingSleepSeconds);
}
