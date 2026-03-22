import z from "zod";
import { customAlphabet } from "nanoid";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { PrismaClient } from "@prisma/client";
import { sendWatchPartyInvitations } from "~/server/services/email";
import { formatShowtimeDate, formatShowtimeTime } from "~/lib/utils";
import {
    isWatchPartyParticipant,
    mapWatchPartyDetail,
    mapWatchPartyListItem,
    normalizeInviteCode,
    watchPartyDetailInclude,
    watchPartyListInclude,
} from "./watchParty.utils";

const MAX_NUM_PARTICIPANTS = 5;
const MIN_NUM_PARTICIPANTS = 1;

const generateCode = customAlphabet("23456789ABCDEFGHJKLMNPQRSTUVWXYZ", 7);

const generateUniqueCode = async (db: PrismaClient): Promise<string> => {
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
                emails: z
                    .array(z.string().email())
                    .min(MIN_NUM_PARTICIPANTS)
                    .max(MAX_NUM_PARTICIPANTS),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (input.emails.includes(ctx.user.email)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "You cannot invite yourself to a watch party. Please remove your email from the invite list.",
                });
            }
            const inviteCode = await generateUniqueCode(ctx.db);

            const watchParty = await ctx.db.watchParty.create({
                data: {
                    showtimeId: input.showtimeId,
                    name: input.name,
                    hostUserId: ctx.user.id,
                    inviteCode,
                },
            });

            // Send email invitations asynchronously so we don't block the response
            Promise.all([
                ctx.db.showtime.findUnique({
                    where: { id: input.showtimeId },
                    include: { movie: true },
                }),
                ctx.db.user.findUnique({
                    where: { id: ctx.user.id },
                }),
            ])
                .then(async ([showtime, host]) => {
                    if (showtime && host) {
                        const hostName =
                            `${host.firstName} ${host.lastName}`.trim();

                        await sendWatchPartyInvitations({
                            emails: input.emails,
                            hostName,
                            movieTitle: showtime.movie.title,
                            moviePosterUrl: showtime.movie.posterUrl ?? "",
                            showDate: formatShowtimeDate(showtime.startTime),
                            showTime: formatShowtimeTime(showtime.startTime),
                            inviteCode,
                        });
                    }
                })
                .catch((error) => {
                    console.error("Failed to send watch party invites:", error);
                });

            return watchParty;
        }),
    join: protectedProcedure
        .input(
            z.object({
                inviteCode: z.string().trim().min(1).max(32),
            })
        )
        .mutation(async ({ ctx, input }) => {
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

            const isHost = party.hostUserId === ctx.user.id;
            const hasJoined = isWatchPartyParticipant(party, ctx.user.id);

            if (!isHost && !hasJoined && party.status === "CONFIRMED") {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "This watch party has already been booked and cannot be joined anymore.",
                });
            }

            if (!isHost && !hasJoined) {
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
            }

            return {
                id: party.id,
                joined: !isHost && !hasJoined,
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
