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

export function getPersonName(person: {
    firstName: string;
    lastName: string;
    email: string;
}): string | null {
    const fullName = `${person.firstName} ${person.lastName}`.trim();
    return fullName.length > 0 ? fullName : null;
}

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

    return party.showtime
        ? `${party.showtime.movie.title} Watch Party`
        : "Watch Party";
}

function mapPartyPerson(person: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
}): WatchPartyPerson {
    return {
        id: person.id,
        email: person.email,
        name: getPersonName(person),
    };
}

export function normalizeInviteCode(inviteCode: string) {
    return inviteCode.trim().toUpperCase();
}

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

export function isWatchPartyJoinable(status: WatchPartyStatus) {
    return status === WatchPartyStatus.OPEN;
}

export function mapWatchPartyListItem(
    party: WatchPartyListRecord
): WatchPartyListItem {
    if (!party.hostUser || !party.showtime) {
        throw new Error("Watch party is missing its host or showtime.");
    }

    return {
        id: party.id,
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

export function mapWatchPartyDetail(
    party: WatchPartyDetailRecord,
    viewerId: string
): WatchPartyDetail {
    const listItem = mapWatchPartyListItem(party);

    return {
        ...listItem,
        memberCount: party._count.participants + 1,
        participants: party.participants.map((participant) => ({
            ...mapPartyPerson(participant),
            role: "PARTICIPANT",
        })),
        viewerRole: party.hostUserId === viewerId ? "LEADER" : "PARTICIPANT",
    };
}
