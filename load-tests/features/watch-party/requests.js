// @ts-nocheck
import { trpcGet, trpcPost } from "../../lib/trpc.js";

export function createWatchParty(
    baseUrl,
    showtimeId,
    name,
    inviteEmails,
    authHeaders
) {
    return trpcPost(
        baseUrl,
        "watchParty.create",
        {
            showtimeId,
            name,
            emails: inviteEmails,
        },
        {
            headers: authHeaders,
            tags: {
                area: "watch_party",
                scenario: "create_party",
                request_type: "write_post",
                endpoint: "watchParty.create",
            },
        }
    );
}

export function joinWatchParty(baseUrl, inviteCode, authHeaders) {
    return trpcPost(
        baseUrl,
        "watchParty.join",
        { inviteCode },
        {
            headers: authHeaders,
            tags: {
                area: "watch_party",
                scenario: "join_party",
                request_type: "write_post",
                endpoint: "watchParty.join",
            },
        }
    );
}

export function fetchWatchPartyById(baseUrl, partyId, authHeaders) {
    return trpcGet(
        baseUrl,
        "watchParty.getById",
        { partyId },
        {
            headers: authHeaders,
            tags: {
                area: "watch_party",
                scenario: "party_detail",
                request_type: "read_get",
                endpoint: "watchParty.getById",
            },
        }
    );
}

export function createWatchPartyBookingSession(
    baseUrl,
    watchPartyId,
    authHeaders
) {
    return trpcPost(
        baseUrl,
        "bookingSession.createForWatchParty",
        { watchPartyId },
        {
            headers: authHeaders,
            tags: {
                area: "watch_party",
                scenario: "start_group_booking",
                request_type: "write_post",
                endpoint: "bookingSession.createForWatchParty",
            },
        }
    );
}

export function getWatchPartyIdFromCreateResponse(response) {
    try {
        return response.json("result.data.json.id") ?? null;
    } catch {
        return null;
    }
}

export function getInviteCodeFromCreateResponse(response) {
    try {
        return response.json("result.data.json.inviteCode") ?? null;
    } catch {
        return null;
    }
}
