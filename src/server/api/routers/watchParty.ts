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

function queueWatchPartyInvitations({
    emails,
    inviteCode,
    loadInvitationData,
}: {
    emails: string[];
    inviteCode: string;
    loadInvitationData: () => Promise<WatchPartyInvitationEmailData>;
}) {
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

export const generateUniqueCode = async (db: PrismaClient): Promise<string> => {
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

            if (!party) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Watch party not found.",
                });
            }

            return mapWatchPartyDetail(party, ctx.user.id);
        }),
});
