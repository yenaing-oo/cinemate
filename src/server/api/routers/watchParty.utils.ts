import { Prisma, WatchPartyStatus } from "@prisma/client";
import type {
    WatchPartyDetail,
    WatchPartyListItem,
    WatchPartyPerson,
} from "~/lib/watch-party/types";

const watchPartyUserSelect = Prisma.validator<Prisma.UserSelect>()({
    id: true,
    email: true,
    firstName: true,
    lastName: true,
});

export const watchPartyListInclude =
    Prisma.validator<Prisma.WatchPartyInclude>()({
        // Keep list queries narrow because dashboard cards do not need the full
        // participant roster.
        hostUser: {
            select: watchPartyUserSelect,
        },
        showtime: {
            select: {
                id: true,
                startTime: true,
                price: true,
                movie: {
                    select: {
                        title: true,
                    },
                },
            },
        },
        _count: {
            select: {
                participants: true,
            },
        },
    });

export const watchPartyDetailInclude =
    Prisma.validator<Prisma.WatchPartyInclude>()({
        ...watchPartyListInclude,
        participants: {
            // A stable participant order keeps detail rendering and ticket
            // assignment logic aligned across requests.
            orderBy: [
                { firstName: "asc" },
                { lastName: "asc" },
                { email: "asc" },
            ],
            select: watchPartyUserSelect,
        },
    });

type WatchPartyListRecord = Prisma.WatchPartyGetPayload<{
    include: typeof watchPartyListInclude;
}>;

type WatchPartyDetailRecord = Prisma.WatchPartyGetPayload<{
    include: typeof watchPartyDetailInclude;
}>;

/**
 * Prefers a human-readable full name but falls back to null so calling code can
 * decide whether to display the email address instead.
 */
export function getPersonName(person: {
    firstName: string;
    lastName: string;
    email: string;
}): string | null {
    const fullName = `${person.firstName} ${person.lastName}`.trim();
    return fullName.length > 0 ? fullName : null;
}

/**
 * Returns the custom watch party name when present, otherwise derives a stable
 * fallback from the showtime's movie title.
 */
export function getPartyName(party: {
    name: string | null;
    showtime: {
        movie: {
            title: string;
        };
    } | null;
}) {
    const trimmedName = party.name?.trim();

    if (trimmedName) {
        return trimmedName;
    }

    // Falling back to the movie title keeps list and detail views stable even
    // when the host skips the optional custom party name.
    return party.showtime
        ? `${party.showtime.movie.title} Watch Party`
        : "Watch Party";
}

/**
 * Maps a user record into the shared watch party person shape used by list and
 * detail responses.
 */
function mapPartyPerson(person: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}): WatchPartyPerson {
    return {
        id: person.id,
        email: person.email,
        // Preserve null when no real name exists so the UI can intentionally
        // fall back to email instead of showing an empty string.
        name: getPersonName(person),
    };
}

/**
 * Canonicalizes invite codes so lookups do not depend on UI casing or
 * accidental surrounding whitespace.
 */
export function normalizeInviteCode(inviteCode: string) {
    return inviteCode.trim().toUpperCase();
}

/**
 * Checks whether the given user is already connected as a participant.
 */
export function isWatchPartyParticipant(
    party: {
        participants: {
            id: string;
        }[];
    },
    userId: string
) {
    return party.participants.some((participant) => participant.id === userId);
}

/**
 * New participants can only join while the party is still open. Closed and
 * confirmed parties have already locked their booking state.
 */
export function isWatchPartyJoinable(status: WatchPartyStatus) {
    return status === WatchPartyStatus.OPEN;
}

/**
 * Maps the database record into the lighter list payload consumed by dashboard
 * cards and other summary views.
 */
export function mapWatchPartyListItem(
    party: WatchPartyListRecord
): WatchPartyListItem {
    if (!party.hostUser || !party.showtime) {
        throw new Error("Watch party is missing its host or showtime.");
    }

    return {
        id: party.id,
        // Derived naming keeps list rows readable even when the optional custom
        // party name is omitted at creation time.
        name: getPartyName(party),
        inviteCode: party.inviteCode,
        status: party.status,
        leader: mapPartyPerson(party.hostUser),
        showtime: {
            id: party.showtime.id,
            startTime: party.showtime.startTime,
            price: Number(party.showtime.price),
            movie: {
                title: party.showtime.movie.title,
            },
        },
        _count: {
            participants: party._count.participants,
        },
    };
}

/**
 * Extends the summary payload with participant details and the viewer role used
 * to gate host-only actions in the UI.
 */
export function mapWatchPartyDetail(
    party: WatchPartyDetailRecord,
    viewerId: string
): WatchPartyDetail {
    const listItem = mapWatchPartyListItem(party);

    return {
        ...listItem,
        // The host is not included in Prisma's participant count, but the UI
        // needs the total headcount for booking and summary copy.
        memberCount: party._count.participants + 1,
        participants: party.participants.map((participant) => ({
            ...mapPartyPerson(participant),
            role: "PARTICIPANT",
        })),
        viewerRole: party.hostUserId === viewerId ? "LEADER" : "PARTICIPANT",
    };
}
