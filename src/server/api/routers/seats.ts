import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

export const seatsRouter = createTRPCRouter({
    getSeatsForShowtime: publicProcedure
        .input(z.object({ showtimeId: z.string() }))
        .query(async ({ input }) => {
            const seats = await db.showtimeSeat.findMany({
                where: { showtimeId: input.showtimeId },
                include: { seat: true },
            });
            return seats.map((s) => ({
                seatId: s.seatId,
                row: s.seat.row,
                number: s.seat.number,
                status: s.status,
            }));
        }),
});
