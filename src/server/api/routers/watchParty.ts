import { randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import { Prisma, WatchPartyStatus, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const watchPartySummaryInclude = {
    leader: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    showtime: {
        include: {
            movie: {
                select: {
                    id: true,
                    title: true,
                    posterUrl: true,
                },
            },
        },
    },
    _count: {
        select: {
            participants: true,
        },
    },
} satisfies Prisma.WatchPartyInclude;

export const watchPartyRouter = createTRPCRouter({
    listMine: protectedProcedure.query(async ({ ctx }) => {
        try {
            const [createdParties, joinedMemberships] = await Promise.all([
                ctx.db.watchParty.findMany({
                    where: {
                        leaderId: ctx.user.id,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    include: watchPartySummaryInclude,
                }),
                ctx.db.watchPartyParticipant.findMany({
                    where: {
                        userId: ctx.user.id,
                        watchParty: {
                            leaderId: {
                                not: ctx.user.id,
                            },
                        },
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    include: {
                        watchParty: {
                            include: watchPartySummaryInclude,
                        },
                    },
                }),
            ]);

            return {
                ok: true as const,
                createdParties,
                joinedParties: joinedMemberships.map(
                    (membership) => membership.watchParty
                ),
                message: null,
            };
        } catch (error) {
            return {
                ok: false as const,
                createdParties: [],
                joinedParties: [],
                message: toWatchPartyUnavailableMessage(error),
            };
        }
    }),

    getById: protectedProcedure
        .input(
            z.object({
                partyId: z.string().min(1),
            })
        )
        .query(async ({ ctx, input }) => {
            try {
                const party = await ctx.db.watchParty.findUnique({
                    where: {
                        id: input.partyId,
                    },
                    include: {
                        ...watchPartySummaryInclude,
                        participants: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: "asc",
                            },
                        },
                    },
                });

                if (!party) {
                    return {
                        ok: false as const,
                        party: null,
                        role: null,
                        message: "Watch Party not found",
                    };
                }

                const isLeader = party.leaderId === ctx.user.id;
                const isParticipant = party.participants.some(
                    (participant) => participant.userId === ctx.user.id
                );

                if (!isLeader && !isParticipant) {
                    throw new TRPCError({ code: "FORBIDDEN" });
                }

                return {
                    ok: true as const,
                    party,
                    role: isLeader ? ("leader" as const) : ("guest" as const),
                    message: null,
                };
            } catch (error) {
                if (error instanceof TRPCError) {
                    throw error;
                }

                return {
                    ok: false as const,
                    party: null,
                    role: null,
                    message: toWatchPartyUnavailableMessage(error),
                };
            }
        }),

    joinByInviteCode: protectedProcedure
        .input(
            z.object({
                inviteCode: z.string().trim().min(4).max(32),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                const inviteCode = input.inviteCode.trim().toUpperCase();
                const party = await ctx.db.watchParty.findUnique({
                    where: {
                        inviteCode,
                    },
                    select: {
                        id: true,
                        leaderId: true,
                    },
                });

                if (!party) {
                    return {
                        ok: false as const,
                        partyId: null,
                        message: "Invite code not found",
                    };
                }

                if (party.leaderId !== ctx.user.id) {
                    await ctx.db.watchPartyParticipant.upsert({
                        where: {
                            watchPartyId_userId: {
                                watchPartyId: party.id,
                                userId: ctx.user.id,
                            },
                        },
                        update: {},
                        create: {
                            watchPartyId: party.id,
                            userId: ctx.user.id,
                        },
                    });
                }

                return {
                    ok: true as const,
                    partyId: party.id,
                    message: null,
                };
            } catch (error) {
                return {
                    ok: false as const,
                    partyId: null,
                    message: toWatchPartyUnavailableMessage(error),
                };
            }
        }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().trim().min(3).max(80),
                showtimeId: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            try {
                const showtime = await ctx.db.showtime.findUnique({
                    where: {
                        id: input.showtimeId,
                    },
                    include: {
                        movie: {
                            select: {
                                id: true,
                                title: true,
                                posterUrl: true,
                            },
                        },
                    },
                });

                if (!showtime) {
                    return {
                        ok: false as const,
                        party: null,
                        message: "Showtime not found",
                    };
                }

                if (showtime.startTime <= new Date()) {
                    return {
                        ok: false as const,
                        party: null,
                        message:
                            "Watch Parties can only be created for upcoming showtimes",
                    };
                }

                const inviteCode = await generateUniqueInviteCode(ctx.db);

                const party = await ctx.db.watchParty.create({
                    data: {
                        leaderId: ctx.user.id,
                        showtimeId: input.showtimeId,
                        name: input.name,
                        inviteCode,
                        status: WatchPartyStatus.OPEN,
                    },
                    include: watchPartySummaryInclude,
                });

                return {
                    ok: true as const,
                    party,
                    message: null,
                };
            } catch (error) {
                return {
                    ok: false as const,
                    party: null,
                    message: toWatchPartyUnavailableMessage(error),
                };
            }
        }),
});

async function generateUniqueInviteCode(db: PrismaClient) {
    for (let attempt = 0; attempt < 10; attempt += 1) {
        const inviteCode = randomBytes(4).toString("hex").toUpperCase();
        const existing = await db.watchParty.findUnique({
            where: { inviteCode },
            select: { id: true },
        });

        if (!existing) {
            return inviteCode;
        }
    }

    throw new Error("Failed to generate a unique invite code");
}

function toWatchPartyUnavailableMessage(error: unknown) {
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return "Watch Party is unavailable because the database is not running.";
    }

    if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2021"
    ) {
        return "Watch Party is unavailable until the latest database migration is applied.";
    }

    return "Watch Party could not be loaded right now.";
}
