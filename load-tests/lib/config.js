// @ts-nocheck
const LOCAL_BASE_URL = "http://localhost:3000";

export function getBaseUrl() {
    if (__ENV.BASE_URL) {
        return __ENV.BASE_URL;
    }

    return LOCAL_BASE_URL;
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

export function hasSupabaseCredentials() {
    return Boolean(
        __ENV.SUPABASE_URL &&
        __ENV.SUPABASE_ANON_KEY &&
        __ENV.TEST_USER_EMAIL &&
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
        hasSupabaseCredentials: hasSupabaseCredentials(),
    };
}
