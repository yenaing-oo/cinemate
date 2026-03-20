import z from "zod";
import { customAlphabet } from "nanoid";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import type { PrismaClient } from "@prisma/client";

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
                emails: z.array(z.string().email()),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const inviteCode = await generateUniqueCode(ctx.db);

            const watchParty = await ctx.db.watchParty.create({
                data: {
                    showtimeId: input.showtimeId,
                    name: input.name,
                    hostUserId: ctx.user.id,
                    inviteCode,
                },
            });

            return watchParty;
        }),
});
