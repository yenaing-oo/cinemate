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
                scenario: "session_create",
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
                scenario: "ticket_count",
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

export function getResponseErrorMessage(response) {
    try {
        const payload = JSON.parse(response.body);
        const candidates = Array.isArray(payload) ? payload : [payload];

        for (const candidate of candidates) {
            const message =
                candidate?.error?.json?.message ??
                candidate?.error?.message ??
                candidate?.message ??
                candidate?.error?.data?.code ??
                null;

            if (message) {
                return message;
            }
        }

        return null;
    } catch {
        return null;
    }
}

export function getAvailableSeatIdsFromResponse(
    response,
    ticketCount,
    options = {}
) {
    try {
        const seats = response.json("result.data.json");

        if (!Array.isArray(seats)) {
            return [];
        }

        const {
            excludedSeatIds = [],
            partitionCount = 1,
            partitionIndex = 0,
            rotationOffset = 0,
        } = options;
        const availableSeats = seats.filter(
            (seat) => !seat?.isBooked && seat?.id
        );

        if (availableSeats.length < ticketCount) {
            return [];
        }

        const excludedSeatIdSet = new Set(excludedSeatIds);
        const filteredSeats = availableSeats.filter(
            (seat) => !excludedSeatIdSet.has(seat.id)
        );

        if (filteredSeats.length < ticketCount) {
            return [];
        }

        const sortedSeats = filteredSeats.sort((leftSeat, rightSeat) => {
            const leftRow = String(leftSeat.row ?? "");
            const rightRow = String(rightSeat.row ?? "");

            if (leftRow !== rightRow) {
                return leftRow.localeCompare(rightRow);
            }

            const leftNumber = Number(leftSeat.number ?? 0);
            const rightNumber = Number(rightSeat.number ?? 0);

            if (leftNumber !== rightNumber) {
                return leftNumber - rightNumber;
            }

            return String(leftSeat.id).localeCompare(String(rightSeat.id));
        });
        const safePartitionCount = Math.max(1, partitionCount);
        const safePartitionIndex =
            ((partitionIndex % safePartitionCount) + safePartitionCount) %
            safePartitionCount;
        const preferredSeats = sortedSeats.filter(
            (seat) =>
                getStableSeatHash(seat.id) % safePartitionCount ===
                safePartitionIndex
        );
        const partitionCandidates =
            preferredSeats.length >= ticketCount ? preferredSeats : sortedSeats;
        const safeOffset = rotationOffset % partitionCandidates.length;
        const rotatedSeats = partitionCandidates
            .slice(safeOffset)
            .concat(partitionCandidates.slice(0, safeOffset));

        return rotatedSeats.slice(0, ticketCount).map((seat) => seat.id);
    } catch {
        return [];
    }
}

function getStableSeatHash(seatId) {
    return Array.from(String(seatId)).reduce(
        (hash, character) => hash + character.charCodeAt(0),
        0
    );
}
