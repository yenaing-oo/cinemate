// @ts-nocheck
import { check, group, sleep } from "k6";

import { getLoadProfile } from "../../lib/config.js";
import { resolveShowtime } from "../../lib/showtime-resolution.js";
import {
    fetchShowtimeSeats,
    getAvailableSeatIdsFromResponse,
    getResponseErrorMessage,
    getSessionIdFromCreateResponse,
    goBackToSeatSelection,
    goToCheckout,
} from "../booking/requests.js";
import {
    createWatchParty,
    createWatchPartyBookingSession,
    fetchWatchPartyById,
    getInviteCodeFromCreateResponse,
    getWatchPartyIdFromCreateResponse,
    joinWatchParty,
} from "./requests.js";

const loadProfile = getLoadProfile("WATCH_PARTY", {
    vus: 20,
    duration: "5m",
    gracefulStop: "30s",
    iterationSeconds: 42,
});

const WATCH_PARTY_SIZE = 2;
const LOAD_TEST_USER_EMAIL_HEADER = "x-load-test-user-email";

function buildLoadTestAuthHeaders(email) {
    return {
        [LOAD_TEST_USER_EMAIL_HEADER]: email,
    };
}

function validateWatchPartyConfig(config) {
    if (!config.loadTestMode) {
        throw new Error(
            "Watch party load test requires LOAD_TEST_MODE=true in load-tests/.env, and the local app should be started with pnpm dev:loadtest"
        );
    }

    if (config.watchPartyHostEmails.length < loadProfile.vus) {
        throw new Error(
            `Watch party load test requires at least ${loadProfile.vus} seeded host users. Set WATCH_PARTY_HOST_EMAILS explicitly or let WATCH_PARTY_HOST_EMAIL_PREFIX/WATCH_PARTY_USER_EMAIL_DOMAIN generate them.`
        );
    }

    if (config.watchPartyParticipantEmails.length < loadProfile.vus) {
        throw new Error(
            `Watch party load test requires at least ${loadProfile.vus} seeded participant users. Set WATCH_PARTY_PARTICIPANT_EMAILS explicitly or let WATCH_PARTY_PARTICIPANT_EMAIL_PREFIX/WATCH_PARTY_USER_EMAIL_DOMAIN generate them.`
        );
    }
}

function getUnauthorizedSetupMessage(email, response) {
    const errorMessage = getResponseErrorMessage(response);
    return `showtimeSeats.getByShowtime returned UNAUTHORIZED for ${email}. Start the app with LOAD_TEST_MODE=true (use pnpm dev:loadtest for local runs) and ensure the seeded watch party user exists. ${
        errorMessage ? `Server message: ${errorMessage}` : ""
    }`.trim();
}

function getRequiredSeatCapacity() {
    return loadProfile.vus * WATCH_PARTY_SIZE;
}

export function buildOptions() {
    const minimumRequestRate =
        (loadProfile.vus * 7) / loadProfile.iterationSeconds;

    return {
        discardResponseBodies: false,
        thresholds: {
            http_reqs: [`rate>=${minimumRequestRate.toFixed(2)}`],
            http_req_failed: ["rate<0.05"],
            http_req_duration: ["p(95)<2000"],
        },
        scenarios: {
            watch_party_booking: {
                executor: "constant-vus",
                exec: "watchPartyScenario",
                vus: loadProfile.vus,
                duration: loadProfile.duration,
                gracefulStop: loadProfile.gracefulStop,
            },
        },
    };
}

export function setupScenario(config) {
    validateWatchPartyConfig(config);

    const hostEmail = config.watchPartyHostEmails[0];
    const showtimeResolution = resolveShowtime({
        baseUrl: config.baseUrl,
        authHeaders: buildLoadTestAuthHeaders(hostEmail),
        authUserLabel: hostEmail,
        includeUnreleasedMoviesForLoadTest: true,
        requiredSeatCapacity: getRequiredSeatCapacity(),
        minimumSeatCount: WATCH_PARTY_SIZE,
        contextLabel: "watch party",
        getUnauthorizedMessage: getUnauthorizedSetupMessage,
    });

    console.log(`k6 baseUrl=${config.baseUrl}`);
    console.log(
        "Running watch party baseline: watchParty.create + watchParty.join + bookingSession.createForWatchParty + bookingSession.update"
    );
    console.log(
        `Auto-resolved watch party showtimeId=${showtimeResolution.showtimeId} movie="${showtimeResolution.movieTitle}" startTime=${showtimeResolution.startTime} availableSeats=${showtimeResolution.availableSeatCount}`
    );

    return {
        ...config,
        showtimeId: showtimeResolution.showtimeId,
        showtimeResolution,
        loadProfile,
    };
}

function getAssignedUsers(data) {
    const index = (__VU - 1) % loadProfile.vus;

    return {
        hostEmail: data.watchPartyHostEmails[index],
        participantEmail: data.watchPartyParticipantEmails[index],
    };
}

function createPartyState(data) {
    const users = getAssignedUsers(data);
    const hostHeaders = buildLoadTestAuthHeaders(users.hostEmail);
    const participantHeaders = buildLoadTestAuthHeaders(users.participantEmail);
    const partyName = `Load Test Party VU${__VU} Iter${__ITER}`;

    const createResponse = createWatchParty(
        data.baseUrl,
        data.showtimeId,
        partyName,
        [users.participantEmail],
        hostHeaders
    );
    const watchPartyId = getWatchPartyIdFromCreateResponse(createResponse);
    const inviteCode = getInviteCodeFromCreateResponse(createResponse);
    const createErrorMessage = getResponseErrorMessage(createResponse);

    check(createResponse, {
        "watchParty.create status is 200": (r) => r.status === 200,
        "watchParty.create returned party id": () => Boolean(watchPartyId),
        "watchParty.create returned invite code": () => Boolean(inviteCode),
    });

    if (createResponse.status !== 200 || !watchPartyId || !inviteCode) {
        throw new Error(
            `Unable to create watch party for ${users.hostEmail}: ${
                createErrorMessage ?? `status ${createResponse.status}`
            }`
        );
    }

    return {
        ...users,
        watchPartyId,
        inviteCode,
        hostHeaders,
        participantHeaders,
        excludedSeatIds: [],
    };
}

function joinParty(data, state) {
    const joinResponse = joinWatchParty(
        data.baseUrl,
        state.inviteCode,
        state.participantHeaders
    );
    const joinErrorMessage = getResponseErrorMessage(joinResponse);

    check(joinResponse, {
        "watchParty.join status is 200": (r) => r.status === 200,
    });

    if (joinResponse.status !== 200) {
        throw new Error(
            `Unable to join watch party ${state.watchPartyId} as ${state.participantEmail}: ${
                joinErrorMessage ?? `status ${joinResponse.status}`
            }`
        );
    }
}

function verifyPartyDetail(data, state) {
    const detailResponse = fetchWatchPartyById(
        data.baseUrl,
        state.watchPartyId,
        state.hostHeaders
    );

    check(detailResponse, {
        "watchParty.getById status is 200": (r) => r.status === 200,
        "watchParty.getById shows two members": (r) => {
            try {
                return (
                    r.json("result.data.json.memberCount") === WATCH_PARTY_SIZE
                );
            } catch {
                return false;
            }
        },
    });

    if (detailResponse.status !== 200) {
        throw new Error(
            `Unable to load watch party detail for ${state.hostEmail}: status ${detailResponse.status}`
        );
    }
}

function startWatchPartyBooking(data, state) {
    const createSessionResponse = createWatchPartyBookingSession(
        data.baseUrl,
        state.watchPartyId,
        state.hostHeaders
    );
    const sessionId = getSessionIdFromCreateResponse(createSessionResponse);
    const createSessionErrorMessage = getResponseErrorMessage(
        createSessionResponse
    );

    check(createSessionResponse, {
        "bookingSession.createForWatchParty status is 200": (r) =>
            r.status === 200,
        "bookingSession.createForWatchParty returned session id": () =>
            Boolean(sessionId),
    });

    if (createSessionResponse.status !== 200 || !sessionId) {
        throw new Error(
            `Unable to create watch party booking session for ${state.hostEmail}: ${
                createSessionErrorMessage ??
                `status ${createSessionResponse.status}`
            }`
        );
    }

    return sessionId;
}

function lookupSeatIds(data, state, rotationOffset) {
    const seatLookup = fetchShowtimeSeats(
        data.baseUrl,
        data.showtimeId,
        state.hostHeaders
    );

    if (seatLookup.status === 401) {
        throw new Error(
            getUnauthorizedSetupMessage(state.hostEmail, seatLookup)
        );
    }

    const selectedSeatIds = getAvailableSeatIdsFromResponse(
        seatLookup,
        WATCH_PARTY_SIZE,
        {
            excludedSeatIds: state.excludedSeatIds ?? [],
            partitionCount: loadProfile.vus,
            partitionIndex: (__VU - 1) % loadProfile.vus,
            rotationOffset,
        }
    );

    check(seatLookup, {
        "showtimeSeats.getByShowtime GET status is 200": (r) =>
            r.status === 200,
        "showtimeSeats.getByShowtime has enough available seats": () =>
            selectedSeatIds.length === WATCH_PARTY_SIZE,
    });

    if (selectedSeatIds.length !== WATCH_PARTY_SIZE) {
        throw new Error(
            `Unable to select ${WATCH_PARTY_SIZE} seats for ${state.hostEmail}`
        );
    }

    return selectedSeatIds;
}

function attemptCheckoutTransition(
    data,
    state,
    sessionId,
    selectedSeatIds,
    rotationOffset
) {
    let checkoutTransition = goToCheckout(
        data.baseUrl,
        sessionId,
        selectedSeatIds,
        state.hostHeaders
    );
    let checkoutErrorMessage = getResponseErrorMessage(checkoutTransition);

    if (
        checkoutTransition.status !== 200 &&
        checkoutErrorMessage?.includes(
            "Some selected seats are no longer available"
        )
    ) {
        state.excludedSeatIds = selectedSeatIds;
        const retrySeatIds = lookupSeatIds(
            data,
            state,
            rotationOffset + loadProfile.vus
        );

        checkoutTransition = goToCheckout(
            data.baseUrl,
            sessionId,
            retrySeatIds,
            state.hostHeaders
        );
        checkoutErrorMessage = getResponseErrorMessage(checkoutTransition);
        state.excludedSeatIds = [];
    }

    return {
        checkoutTransition,
        checkoutErrorMessage,
    };
}

export function runScenario(data) {
    const iterationStartMs = Date.now();
    const rotationOffset = __VU - 1 + __ITER;
    let state = null;
    let sessionId = null;

    group("Create Watch Party", () => {
        state = createPartyState(data);
    });

    group("Join Watch Party", () => {
        joinParty(data, state);
    });

    group("Watch Party Detail", () => {
        verifyPartyDetail(data, state);
    });

    group("Start Group Booking", () => {
        sessionId = startWatchPartyBooking(data, state);
    });

    let selectedSeatIds = [];

    group("Seat Map Lookup", () => {
        selectedSeatIds = lookupSeatIds(data, state, rotationOffset);
    });

    const checkoutResult = group("Checkout Transition", () => {
        const { checkoutTransition, checkoutErrorMessage } =
            attemptCheckoutTransition(
                data,
                state,
                sessionId,
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
        throw new Error(
            `Unable to move watch party session to checkout for ${state.hostEmail}: ${
                checkoutResult.errorMessage ??
                `status ${checkoutResult.response.status}`
            }`
        );
    }

    const rewindResult = group("Return To Seat Selection", () => {
        const rewindTransition = goBackToSeatSelection(
            data.baseUrl,
            sessionId,
            state.hostHeaders
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
        throw new Error(
            `Unable to rewind watch party session after checkout for ${state.hostEmail}: ${
                rewindResult.errorMessage ??
                `status ${rewindResult.response.status}`
            }`
        );
    }

    // 20 VUs * 7 requests/iteration * (60 / 42s) = 200 requests/min total.
    const targetIterationSeconds = data.loadProfile.iterationSeconds;
    const elapsedSeconds = (Date.now() - iterationStartMs) / 1000;
    const remainingSleepSeconds = Math.max(
        0,
        targetIterationSeconds - elapsedSeconds
    );

    sleep(remainingSleepSeconds);
}
