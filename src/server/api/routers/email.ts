import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { Resend } from "resend";
import TicketConfirmation from "~/server/emailTemplates/TicketConfirmation";

const resend = new Resend(process.env.RESEND_EMAIL_API_KEY ?? "");

export const emailRouter = createTRPCRouter({
    send: publicProcedure
        .input(z.object({ recipientEmail: z.string().email() }))
        .mutation(async ({ input }) => {
            const { data, error } = await resend.emails.send({
                from: "Cinemate <onboarding@resend.dev>",
                to: input.recipientEmail,
                subject: "🎉 Booking Confirmed! - Cinemate",
                react: TicketConfirmation({
                    movieTitle:
                        "Avatar: The way of water. And some really big text check!",
                    posterUrl:
                        "https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg",
                    date: "8 Feb, 2025",
                    time: "8:00 PM",
                    screen: "#1",
                    tickets: [
                        {
                            seatNumber: "A1",
                            qrCodeUrl:
                                "https://www.davidleonard.london/wp-content/uploads/2024/05/FI-QRcode-of-URL.png",
                        },
                        {
                            seatNumber: "A2",
                            qrCodeUrl:
                                "https://www.davidleonard.london/wp-content/uploads/2024/05/FI-QRcode-of-URL.png",
                        },
                        {
                            seatNumber: "A3",
                            qrCodeUrl:
                                "https://www.davidleonard.london/wp-content/uploads/2024/05/FI-QRcode-of-URL.png",
                        },
                    ],
                    totalPrice: "$15.00",
                    bookingId: "ABCD1234",
                }),
            });

            if (error) {
                return { error: error };
            }

            return { ok: true, result: data };
        }),
});
