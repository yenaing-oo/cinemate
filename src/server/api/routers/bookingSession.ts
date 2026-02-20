import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

const SESSION_TTL_MS = 5 * 60 * 1000;

const stepSchema = z.enum(["QUANTITY", "SEATS", "CHECKOUT"]);

const sessionIdentitySchema = z.object({
    sessionToken: z.string().min(1).optional(),
});

const upsertSchema = sessionIdentitySchema.extend({
    showtimeId: z.string().min(1).optional(),
    ticketQuantity: z.number().int().positive().optional(),
    selectedSeatIds: z.array(z.string().min(1)).optional(),
    currentStep: stepSchema.optional(),
});

const buildIdentity = (userId?: string | null, sessionToken?: string) => {
    if (!userId && !sessionToken) {
        throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Missing booking session token.",
        });
    }
    return {
        userId: userId ?? null,
        sessionToken: sessionToken ?? null,
    };
};

const sessionWhere = (identity: {
    userId: string | null;
    sessionToken: string | null;
}) => {
    const clauses = [];
    if (identity.userId) {
        clauses.push({ userId: identity.userId });
    }
    if (identity.sessionToken) {
        clauses.push({ sessionToken: identity.sessionToken });
    }
    if (clauses.length === 0) {
        return { id: "__never__" };
    }
    return { OR: clauses };
};

export const bookingSessionRouter = createTRPCRouter({
    upsert: publicProcedure
        .input(upsertSchema)
        .mutation(async ({ ctx, input }) => {
            const identity = buildIdentity(
                ctx.user?.id ?? null,
                input.sessionToken
            );
            const now = new Date();

            let session = await ctx.db.bookingSession.findFirst({
                where: {
                    status: "ACTIVE",
                    ...sessionWhere(identity),
                },
                orderBy: { updatedAt: "desc" },
            });

            if (session && session.expiresAt <= now) {
                await ctx.db.bookingSession.update({
                    where: { id: session.id },
                    data: { status: "EXPIRED" },
                });
                session = null;
            }

            const selectedSeatIds = input.selectedSeatIds
                ? Array.from(new Set(input.selectedSeatIds))
                : undefined;

            if (!session) {
                const created = await ctx.db.bookingSession.create({
                    data: {
                        userId: identity.userId,
                        sessionToken: identity.sessionToken,
                        showtimeId: input.showtimeId,
                        ticketQuantity: input.ticketQuantity,
                        selectedSeatIds: selectedSeatIds ?? [],
                        currentStep: input.currentStep ?? "QUANTITY",
                        status: "ACTIVE",
                        startedAt: now,
                        expiresAt: new Date(now.getTime() + SESSION_TTL_MS),
                    },
                });
                return created;
            }

            const updated = await ctx.db.bookingSession.update({
                where: { id: session.id },
                data: {
                    showtimeId: input.showtimeId ?? session.showtimeId,
                    ticketQuantity:
                        input.ticketQuantity ?? session.ticketQuantity,
                    selectedSeatIds: selectedSeatIds ?? session.selectedSeatIds,
                    currentStep: input.currentStep ?? session.currentStep,
                },
            });

            return updated;
        }),
    getActive: publicProcedure
        .input(sessionIdentitySchema)
        .query(async ({ ctx, input }) => {
            if (!ctx.user && !input.sessionToken) {
                return { state: "none" as const };
            }

            const identity = buildIdentity(
                ctx.user?.id ?? null,
                input.sessionToken
            );
            const now = new Date();

            const session = await ctx.db.bookingSession.findFirst({
                where: {
                    status: "ACTIVE",
                    ...sessionWhere(identity),
                },
                orderBy: { updatedAt: "desc" },
            });

            if (!session) {
                return { state: "none" as const };
            }

            if (session.expiresAt <= now) {
                await ctx.db.bookingSession.update({
                    where: { id: session.id },
                    data: { status: "EXPIRED" },
                });
                return { state: "expired" as const };
            }

            return { state: "active" as const, session };
        }),
    expire: publicProcedure
        .input(sessionIdentitySchema)
        .mutation(async ({ ctx, input }) => {
            if (!ctx.user && !input.sessionToken) {
                return { state: "none" as const };
            }

            const identity = buildIdentity(
                ctx.user?.id ?? null,
                input.sessionToken
            );
            const session = await ctx.db.bookingSession.findFirst({
                where: {
                    status: "ACTIVE",
                    ...sessionWhere(identity),
                },
                orderBy: { updatedAt: "desc" },
            });

            if (!session) {
                return { state: "none" as const };
            }

            await ctx.db.$transaction(async (tx) => {
                await tx.bookingSession.update({
                    where: { id: session.id },
                    data: { status: "EXPIRED" },
                });
            });

            return { state: "expired" as const };
        }),
});
