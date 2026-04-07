// Stores and returns the user's saved card summary for checkout flows.
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

const ONLY_DIGITS = /\D/g;

function normalizeCardNumber(input: string) {
    return input.replace(ONLY_DIGITS, "");
}

function assertValidCardNumber(cardNumber: string) {
    if (cardNumber.length < 13 || cardNumber.length > 19) {
        throw new Error("Enter a valid card number.");
    }
}

function getCardBrand(cardNumber: string) {
    if (/^4\d{12,18}$/.test(cardNumber)) {
        return "Visa";
    }

    if (
        /^(5[1-5]\d{14}|2(?:2[2-9]|[3-6]\d|7[01])\d{12}|2720\d{12})$/.test(
            cardNumber
        )
    ) {
        return "Mastercard";
    }

    if (/^3[47]\d{13}$/.test(cardNumber)) {
        return "American Express";
    }

    if (/^(6011\d{12}|65\d{14}|64[4-9]\d{13})$/.test(cardNumber)) {
        return "Discover";
    }

    return "Card";
}

function toSavedPaymentSummary(cardNumber: string | null) {
    if (!cardNumber) {
        return {
            hasSavedCard: false,
            cardLast4: null,
            cardBrand: null,
        };
    }

    return {
        hasSavedCard: true,
        cardLast4: cardNumber.slice(-4),
        cardBrand: getCardBrand(cardNumber),
    };
}

export const paymentMethodRouter = createTRPCRouter({
    getSaved: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db.user.findUnique({
            where: { id: ctx.user.id },
            select: { cardNumber: true },
        });

        return toSavedPaymentSummary(user?.cardNumber ?? null);
    }),

    save: protectedProcedure
        .input(
            z.object({
                cardNumber: z.string().trim().min(1),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const normalizedCardNumber = normalizeCardNumber(input.cardNumber);
            assertValidCardNumber(normalizedCardNumber);

            const updatedUser = await ctx.db.user.update({
                where: { id: ctx.user.id },
                data: {
                    cardNumber: normalizedCardNumber,
                },
                select: {
                    cardNumber: true,
                },
            });

            return toSavedPaymentSummary(updatedUser.cardNumber);
        }),
});
