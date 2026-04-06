// @ts-nocheck
const DEFAULT_DOCKER_BASE_URL = "http://host.docker.internal:3000";
const DEFAULT_BOOKING_USER_EMAIL_PREFIX = "booking-loadtest";
const DEFAULT_BOOKING_USER_EMAIL_DOMAIN = "example.com";

function getScopedEnv(prefix, key) {
    if (!prefix) {
        return undefined;
    }

    return __ENV[`${prefix}_${key}`];
}

export function getBaseUrl() {
    if (__ENV.BASE_URL) {
        return __ENV.BASE_URL;
    }

    return DEFAULT_DOCKER_BASE_URL;
}

export function asBoolean(value, fallback = false) {
    if (value === undefined || value === null) {
        return fallback;
    }

    return String(value).toLowerCase() === "true";
}

export function asNumber(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

export function asCsvArray(value) {
    if (value === undefined || value === null || value === "") {
        return [];
    }

    return String(value)
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function asTrimmedString(value) {
    if (value === undefined || value === null) {
        return undefined;
    }

    const normalizedValue = String(value).trim();
    return normalizedValue === "" ? undefined : normalizedValue;
}

function buildSequentialEmailList(count, options = {}) {
    const prefix =
        String(options.prefix ?? DEFAULT_BOOKING_USER_EMAIL_PREFIX).trim() ||
        DEFAULT_BOOKING_USER_EMAIL_PREFIX;
    const domain =
        String(options.domain ?? DEFAULT_BOOKING_USER_EMAIL_DOMAIN).trim() ||
        DEFAULT_BOOKING_USER_EMAIL_DOMAIN;
    const safeCount = Math.max(0, Math.floor(Number(count) || 0));
    const width = Math.max(2, String(Math.max(safeCount, 1)).length);

    return Array.from({ length: safeCount }, (_, index) => {
        const sequence = String(index + 1).padStart(width, "0");
        return `${prefix}-${sequence}@${domain}`;
    });
}

export function getLoadProfile(prefix, defaults = {}) {
    return {
        vus: asNumber(
            getScopedEnv(prefix, "LOAD_VUS") ?? __ENV.LOAD_VUS,
            defaults.vus ?? 20
        ),
        duration:
            getScopedEnv(prefix, "LOAD_DURATION") ??
            __ENV.LOAD_DURATION ??
            defaults.duration ??
            "5m",
        gracefulStop:
            getScopedEnv(prefix, "LOAD_GRACEFUL_STOP") ??
            __ENV.LOAD_GRACEFUL_STOP ??
            defaults.gracefulStop ??
            "30s",
        iterationSeconds: asNumber(
            getScopedEnv(prefix, "ITERATION_SECONDS") ??
                __ENV.ITERATION_SECONDS,
            defaults.iterationSeconds ?? 12
        ),
    };
}

function getBookingUserEmails() {
    const explicitEmails = asCsvArray(__ENV.TEST_USER_EMAILS);

    if (explicitEmails.length > 0) {
        return explicitEmails;
    }

    const bookingUserCount = asNumber(
        __ENV.BOOKING_LOAD_VUS ?? __ENV.LOAD_VUS,
        20
    );

    return buildSequentialEmailList(bookingUserCount, {
        prefix: __ENV.BOOKING_USER_EMAIL_PREFIX,
        domain: __ENV.BOOKING_USER_EMAIL_DOMAIN,
    });
}

export function getRunConfig() {
    return {
        baseUrl: getBaseUrl(),
        loadTestMode: asBoolean(__ENV.LOAD_TEST_MODE, false),
        loadTestSecret: asTrimmedString(__ENV.LOAD_TEST_SECRET),
        requireWriteSuccess: asBoolean(__ENV.REQUIRE_WRITE_SUCCESS, false),
        sleepSeconds: asNumber(__ENV.SLEEP_SECONDS, 1),
        watchPartyInviteCode: __ENV.WATCH_PARTY_INVITE_CODE,
        bookingTicketCount: asNumber(__ENV.BOOKING_TICKET_COUNT, 1),
        testUserEmails: getBookingUserEmails(),
    };
}
