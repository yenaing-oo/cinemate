import { randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import { WatchPartyStatus } from "@prisma/client";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const watchPartyRouter = createTRPCRouter({
    listMine: protectedProcedure.query(async ({ ctx }) => {
        return ctx.db.watchParty.findMany({
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
    }),

    create: protectedProcedure
        .input(
            z.object({
                name: z.string().trim().min(3).max(80),
                showtimeId: z.string().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
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
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Showtime not found",
                });
            }

            if (showtime.startTime <= new Date()) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message:
                        "Watch Parties can only be created for upcoming showtimes",
                });
            }

            const inviteCode = await generateUniqueInviteCode(ctx.db);

            return ctx.db.watchParty.create({
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
        }),
});

async function generateUniqueInviteCode(db: {
    watchParty: {
        findUnique: (args: {
            where: { inviteCode: string };
            select: { id: true };
        }) => Promise<{ id: string } | null>;
    };
}) {
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

    throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate a unique invite code",
    });
}
