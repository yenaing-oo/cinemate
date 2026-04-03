// @ts-nocheck
const DEFAULT_DOCKER_BASE_URL = "http://host.docker.internal:3000";

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

export function getAuthCookieHeader() {
    const cookie = __ENV.AUTH_COOKIE;
    return cookie ? { Cookie: cookie } : {};
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

export function hasSupabaseCredentials() {
    return Boolean(
        __ENV.SUPABASE_URL &&
        (__ENV.SUPABASE_PUBLISHABLE_KEY || __ENV.SUPABASE_ANON_KEY) &&
        (__ENV.TEST_USER_EMAIL || __ENV.TEST_USER_EMAILS) &&
        __ENV.TEST_USER_PASSWORD
    );
}

export function getRunConfig() {
    return {
        baseUrl: getBaseUrl(),
        requireWriteSuccess: asBoolean(__ENV.REQUIRE_WRITE_SUCCESS, false),
        sleepSeconds: asNumber(__ENV.SLEEP_SECONDS, 1),
        showtimeId: __ENV.SHOWTIME_ID,
        watchPartyInviteCode: __ENV.WATCH_PARTY_INVITE_CODE,
        bookingTicketCount: asNumber(__ENV.BOOKING_TICKET_COUNT, 1),
        supabaseUrl: __ENV.SUPABASE_URL,
        supabaseAnonKey:
            __ENV.SUPABASE_PUBLISHABLE_KEY || __ENV.SUPABASE_ANON_KEY,
        supabaseCookieName: __ENV.SUPABASE_COOKIE_NAME,
        testUserEmails: asCsvArray(__ENV.TEST_USER_EMAILS),
        testUserPassword: __ENV.TEST_USER_PASSWORD,
        hasSupabaseCredentials: hasSupabaseCredentials(),
    };
}
