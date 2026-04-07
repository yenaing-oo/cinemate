import z from "zod";
import { customAlphabet } from "nanoid";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { PrismaClient } from "@prisma/client";
import {
    hasWatchPartyInviteEmail,
    WATCH_PARTY_INVITE_CODE_LENGTH,
    WATCH_PARTY_SELF_INVITE_MESSAGE,
    watchPartyInviteEmailsSchema,
} from "~/lib/watch-party/invite";
import { sendWatchPartyInvitations } from "~/server/services/email";
import { formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";
import {
    isWatchPartyJoinable,
    isWatchPartyParticipant,
    mapWatchPartyDetail,
    mapWatchPartyListItem,
    normalizeInviteCode,
    watchPartyDetailInclude,
    watchPartyListInclude,
} from "./watchParty.utils";

const generateCode = customAlphabet(
    "23456789ABCDEFGHJKLMNPQRSTUVWXYZ",
    WATCH_PARTY_INVITE_CODE_LENGTH
);

type WatchPartyInvitationEmailData = {
    host: {
        email: string;
        firstName: string;
        lastName: string;
    } | null;
    showtime: {
        startTime: Date;
        movie: {
            title: string;
            posterUrl: string | null;
        };
    } | null;
};

/**
 * Rejects invite payloads that would send the host an invitation for their own
 * party. The create flow treats self-invites as invalid input instead of
 * silently filtering them out so the user can correct the list explicitly.
 */
function assertWatchPartyInviteEmails(
    emails: string[],
    userEmail: string
): void {
    if (hasWatchPartyInviteEmail(emails, userEmail)) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: WATCH_PARTY_SELF_INVITE_MESSAGE,
        });
    }
}

/**
 * Sends watch party invitations only when the supporting host and showtime
 * records are still available. Missing relational data means there is no
 * reliable email payload to construct.
 */
export async function deliverWatchPartyInvitations({
    emails,
    host,
    inviteCode,
    showtime,
}: {
    emails: string[];
    host: WatchPartyInvitationEmailData["host"];
    inviteCode: string;
    showtime: WatchPartyInvitationEmailData["showtime"];
}) {
    if (!host || !showtime) {
        return;
    }

    const hostName = `${host.firstName} ${host.lastName}`.trim() || host.email;

    await sendWatchPartyInvitations({
        emails,
        hostName,
        movieTitle: showtime.movie.title,
        moviePosterUrl: showtime.movie.posterUrl ?? "",
        showDate: formatShowtimeDate(showtime.startTime),
        showTime: formatShowtimeTime(showtime.startTime),
        inviteCode,
    });
}

/**
 * Kicks off invitation delivery without blocking the mutation response.
 * Creation succeeds even if email delivery later fails, because the persisted
 * party and invite code remain the source of truth.
 */
function queueWatchPartyInvitations({
    emails,
    inviteCode,
    loadInvitationData,
}: {
    emails: string[];
    inviteCode: string;
    loadInvitationData: () => Promise<WatchPartyInvitationEmailData>;
}) {
    // Invitation delivery stays out of the request path so party creation does
    // not fail after the record is already persisted.
    void loadInvitationData()
        .then((invitationData) =>
            deliverWatchPartyInvitations({
                ...invitationData,
                emails,
                inviteCode,
            })
        )
        .catch((error) => {
            console.error("Failed to send watch party invites:", error);
        });
}

/**
 * Generates a short invite code and verifies uniqueness against persisted
 * watch parties. The alphabet intentionally avoids ambiguous characters to
 * reduce copy and read errors in the UI.
 */
export const generateUniqueCode = async (db: PrismaClient): Promise<string> => {
    // A short bounded retry loop keeps invite codes human-friendly without
    // risking an unbounded collision check if the namespace gets crowded.
    for (let attempts = 0; attempts < 5; attempts++) {
        const code = generateCode();
        const existing = await db.watchParty.findUnique({
            where: { inviteCode: code },
        });
        if (!existing) return code;
    }
    throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate a unique invite code. Please try again.",
    });
};

export const watchPartyRouter = createTRPCRouter({
    create: protectedProcedure
        .input(
            z.object({
                showtimeId: z.string(),
                name: z.string().min(1).max(100).optional(),
                emails: watchPartyInviteEmailsSchema,
            })
        )
        .mutation(async ({ ctx, input }) => {
            // Validate invite recipients before persisting the party so the
            // request fails as a clean input error instead of after creation.
            assertWatchPartyInviteEmails(input.emails, ctx.user.email);
            const inviteCode = await generateUniqueCode(ctx.db);

            const watchParty = await ctx.db.watchParty.create({
                data: {
                    showtimeId: input.showtimeId,
                    name: input.name,
                    hostUserId: ctx.user.id,
                    inviteCode,
                },
            });

            queueWatchPartyInvitations({
                emails: input.emails,
                inviteCode,
                loadInvitationData: async () => {
                    // Fetching after creation ensures the email reflects the
                    // persisted invite code and current host/showtime data.
                    const [showtime, host] = await Promise.all([
                        ctx.db.showtime.findUnique({
                            where: { id: input.showtimeId },
                            select: {
                                startTime: true,
                                movie: {
                                    select: {
                                        title: true,
                                        posterUrl: true,
                                    },
                                },
                            },
                        }),
                        ctx.db.user.findUnique({
                            where: { id: ctx.user.id },
                            select: {
                                email: true,
                                firstName: true,
                                lastName: true,
                            },
                        }),
                    ]);

                    return {
                        host,
                        showtime,
                    };
                },
            });

            return watchParty;
        }),
    join: protectedProcedure
        .input(
            z.object({
                inviteCode: z
                    .string()
                    .trim()
                    .length(WATCH_PARTY_INVITE_CODE_LENGTH),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (!ctx.user.cardNumber) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Add a payment method before joining a watch party.",
                });
            }

            // Normalize before lookup so manual entry, pasted input, and stored
            // codes all resolve through the same canonical representation.
            const inviteCode = normalizeInviteCode(input.inviteCode);
            const party = await ctx.db.watchParty.findUnique({
                where: { inviteCode },
                include: watchPartyDetailInclude,
            });

            if (!party || !party.hostUserId || !party.showtimeId) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Watch party not found.",
                });
            }

            // The host is already implicitly part of the party and should not
            // re-enter through the participant join path.
            if (party.hostUserId === ctx.user.id) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "You cannot join your own watch party.",
                });
            }

            const hasJoined = isWatchPartyParticipant(party, ctx.user.id);

            if (hasJoined) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "You have already joined this watch party.",
                });
            }

            if (!isWatchPartyJoinable(party.status)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "This watch party is not open and cannot be joined.",
                });
            }

            await ctx.db.watchParty.update({
                where: { id: party.id },
                data: {
                    // Joining only mutates membership; host, showtime, and code
                    // remain immutable identifiers for the party.
                    participants: {
                        connect: {
                            id: ctx.user.id,
                        },
                    },
                },
            });

            return {
                id: party.id,
                joined: true,
            };
        }),
    listMine: protectedProcedure.query(async ({ ctx }) => {
        const [createdParties, joinedParties] = await Promise.all([
            ctx.db.watchParty.findMany({
                where: {
                    hostUserId: ctx.user.id,
                    showtimeId: { not: null },
                },
                orderBy: {
                    createdAt: "desc",
                },
                include: watchPartyListInclude,
            }),
            ctx.db.watchParty.findMany({
                where: {
                    hostUserId: { not: null },
                    showtimeId: { not: null },
                    participants: {
                        some: {
                            id: ctx.user.id,
                        },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                include: watchPartyListInclude,
            }),
        ]);

        return {
            createdParties: createdParties.map(mapWatchPartyListItem),
            joinedParties: joinedParties.map(mapWatchPartyListItem),
        };
    }),
    getById: protectedProcedure
        .input(
            z.object({
                partyId: z.string(),
            })
        )
        .query(async ({ ctx, input }) => {
            const party = await ctx.db.watchParty.findFirst({
                where: {
                    id: input.partyId,
                    hostUserId: { not: null },
                    showtimeId: { not: null },
                    OR: [
                        { hostUserId: ctx.user.id },
                        {
                            participants: {
                                some: {
                                    id: ctx.user.id,
                                },
                            },
                        },
                    ],
                },
                include: watchPartyDetailInclude,
            });

            // Access is limited to the host and joined participants so invite
            // codes alone do not expose party details to arbitrary users.
            if (!party) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Watch party not found.",
                });
            }

            return mapWatchPartyDetail(party, ctx.user.id);
        }),
});
