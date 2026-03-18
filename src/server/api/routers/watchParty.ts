import { randomBytes } from "crypto";
import { Prisma, WatchPartyStatus, type PrismaClient } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const watchPartyRouter = createTRPCRouter({
    listMine: protectedProcedure.query(async ({ ctx }) => {
        try {
            const parties = await ctx.db.watchParty.findMany({
                where: {
                    leaderId: ctx.user.id,
                },
                orderBy: {
                    createdAt: "desc",
                },
                include: {
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
                },
            });

            return {
                ok: true as const,
                parties,
                message: null,
            };
        } catch (error) {
            return {
                ok: false as const,
                parties: [],
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
                    include: {
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
                    },
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

    return "Watch Party could not be created right now.";
}
