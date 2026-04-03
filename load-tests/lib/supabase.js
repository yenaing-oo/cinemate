// @ts-nocheck
import http from "k6/http";
import encoding from "k6/encoding";

const MAX_COOKIE_CHUNK_SIZE = 3180;

function extractHostname(rawUrl) {
    const normalizedUrl = String(rawUrl ?? "").trim();

    if (!normalizedUrl) {
        throw new Error("SUPABASE_URL is required for booking load testing");
    }

    const withoutScheme = normalizedUrl.replace(/^[a-zA-Z]+:\/\//, "");
    const authority = withoutScheme.split("/")[0] ?? "";
    const hostWithOptionalPort = authority.includes("@")
        ? authority.split("@").pop()
        : authority;

    if (!hostWithOptionalPort) {
        throw new Error(
            `Unable to determine Supabase host from SUPABASE_URL=${normalizedUrl}`
        );
    }

    return hostWithOptionalPort.split(":")[0] ?? hostWithOptionalPort;
}

function getCookieHostLabel(supabaseUrl) {
    const hostname = extractHostname(supabaseUrl);

    if (hostname === "host.docker.internal") {
        // Local app config uses http://127.0.0.1:54321, so the auth cookie
        // key must match that hostname even though k6 reaches Supabase through
        // host.docker.internal from inside Docker.
        return "127";
    }

    return hostname.split(".")[0];
}

export function getSupabaseCookieName(config) {
    if (config.supabaseCookieName) {
        return config.supabaseCookieName;
    }

    return `sb-${getCookieHostLabel(config.supabaseUrl)}-auth-token`;
}

function createCookiePairs(name, value) {
    if (value.length <= MAX_COOKIE_CHUNK_SIZE) {
        return [`${name}=${value}`];
    }

    const pairs = [];

    for (
        let startIndex = 0, chunkIndex = 0;
        startIndex < value.length;
        startIndex += MAX_COOKIE_CHUNK_SIZE, chunkIndex += 1
    ) {
        pairs.push(
            `${name}.${chunkIndex}=${value.slice(
                startIndex,
                startIndex + MAX_COOKIE_CHUNK_SIZE
            )}`
        );
    }

    return pairs;
}

export function buildSupabaseAuthCookieHeader(config, authSession) {
    const cookieName = getSupabaseCookieName(config);
    const encodedSession = `base64-${encoding.b64encode(
        JSON.stringify(authSession),
        "rawurl"
    )}`;

    return createCookiePairs(cookieName, encodedSession).join("; ");
}

export function signInTestUser(config, email) {
    const response = http.post(
        `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
        JSON.stringify({
            email,
            password: config.testUserPassword,
        }),
        {
            headers: {
                Accept: "application/json",
                apikey: config.supabaseAnonKey,
                Authorization: `Bearer ${config.supabaseAnonKey}`,
                "Content-Type": "application/json",
            },
            tags: {
                area: "booking_setup",
                scenario: "supabase_sign_in",
                request_type: "auth_post",
                endpoint: "supabase.auth.password",
            },
        }
    );

    if (response.status !== 200) {
        throw new Error(
            `Supabase sign-in failed for ${email} with status ${response.status}`
        );
    }

    const authSession = response.json();

    if (!authSession?.access_token || !authSession?.refresh_token) {
        throw new Error(
            `Supabase sign-in for ${email} did not return an auth session`
        );
    }

    return {
        email,
        authCookieHeader: buildSupabaseAuthCookieHeader(config, authSession),
    };
}
