// @ts-nocheck
import { trpcGet, trpcPost } from "../../lib/trpc.js";

export function createBookingSession(baseUrl, showtimeId, authHeaders) {
    return trpcPost(
        baseUrl,
        "bookingSession.create",
        { showtimeId },
        {
            headers: authHeaders,
            tags: {
                area: "booking_checkout",
                scenario: "setup_create_session",
                request_type: "write_post",
                endpoint: "bookingSession.create",
            },
        }
    );
}

export function setBookingTicketCount(
    baseUrl,
    sessionId,
    ticketCount,
    authHeaders
) {
    return trpcPost(
        baseUrl,
        "bookingSession.update",
        {
            sessionId,
            goToStep: "SEAT_SELECTION",
            ticketCount,
        },
        {
            headers: authHeaders,
            tags: {
                area: "booking_checkout",
                scenario: "setup_ticket_count",
                request_type: "write_post",
                endpoint: "bookingSession.update",
            },
        }
    );
}

export function fetchShowtimeSeats(baseUrl, showtimeId, authHeaders) {
    return trpcGet(
        baseUrl,
        "showtimeSeats.getByShowtime",
        { showtimeId },
        {
            headers: authHeaders,
            tags: {
                area: "booking_checkout",
                scenario: "seat_map",
                request_type: "read_get",
                endpoint: "showtimeSeats.getByShowtime",
            },
        }
    );
}

export function goToCheckout(baseUrl, sessionId, selectedSeatIds, authHeaders) {
    return trpcPost(
        baseUrl,
        "bookingSession.update",
        {
            sessionId,
            goToStep: "CHECKOUT",
            selectedSeatIds,
        },
        {
            headers: authHeaders,
            tags: {
                area: "booking_checkout",
                scenario: "checkout_transition",
                request_type: "write_post",
                endpoint: "bookingSession.update",
            },
        }
    );
}

export function goBackToSeatSelection(baseUrl, sessionId, authHeaders) {
    return trpcPost(
        baseUrl,
        "bookingSession.update",
        {
            sessionId,
            goToStep: "SEAT_SELECTION",
        },
        {
            headers: authHeaders,
            tags: {
                area: "booking_checkout",
                scenario: "rewind_to_seat_selection",
                request_type: "write_post",
                endpoint: "bookingSession.update",
            },
        }
    );
}

export function getSessionIdFromCreateResponse(response) {
    try {
        return response.json("result.data.json.id") ?? null;
    } catch {
        return null;
    }
}

export function getAvailableSeatIdsFromResponse(
    response,
    ticketCount,
    rotationOffset = 0
) {
    try {
        const seats = response.json("result.data.json");

        if (!Array.isArray(seats)) {
            return [];
        }

        const availableSeats = seats.filter(
            (seat) => !seat?.isBooked && seat?.id
        );

        if (availableSeats.length < ticketCount) {
            return [];
        }

        const safeOffset = rotationOffset % availableSeats.length;
        const rotatedSeats = availableSeats
            .slice(safeOffset)
            .concat(availableSeats.slice(0, safeOffset));

        return rotatedSeats.slice(0, ticketCount).map((seat) => seat.id);
    } catch {
        return [];
    }
}
