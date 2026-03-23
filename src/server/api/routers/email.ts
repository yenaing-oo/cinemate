import { z } from "zod";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { Resend } from "resend";
import TicketConfirmation from "~/server/emailTemplates/TicketConfirmation";

export const emailRouter = createTRPCRouter({
    sendConfirmation: protectedProcedure
        .input(
            z.object({
                userId: z.string(),
                movieTitle: z.string(),
                moviePosterUrl: z.string(),
                showDate: z.string(),
                showTime: z.string(),
                seatLabelList: z.string().array(),
                totalPrice: z.string(),
                bookingId: z.string(),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const apiKey = process.env.RESEND_EMAIL_API_KEY;
            if (!apiKey) {
                return {
                    ok: false,
                    error: "RESEND_EMAIL_API_KEY is missing or empty",
                };
            }
            const resend = new Resend(apiKey);

            const user = await ctx.db.user.findUnique({
                where: { id: input.userId },
            });

            if (!user || !user.email) return;

            const { data, error } = await resend.emails.send({
                from: "Cinemate <onboarding@bookcinemate.me>",
                to: user.email,
                subject: "🎉 Booking Confirmed! - Cinemate",
                react: TicketConfirmation({
                    movieTitle: input.movieTitle,
                    posterUrl: input.moviePosterUrl,
                    date: input.showDate,
                    time: input.showTime,
                    screen: "#1",
                    seatLabelList: input.seatLabelList,
                    totalPrice: input.totalPrice,
                    bookingId: input.bookingId,
                }),
            });

            if (error) {
                return { error: error };
            }

            return { ok: true, result: data };
        }),
});
