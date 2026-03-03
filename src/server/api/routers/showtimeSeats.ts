import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { isShowtimeSeatAvailable } from "~/server/utils";

export const showtimeSeatsRouter = createTRPCRouter({
    getByShowtime: protectedProcedure
        .input(z.object({ showtimeId: z.string() }))
        .query(async ({ input, ctx }) => {
            const now = new Date();
            const showtimeSeats = await db.showtimeSeat.findMany({
                where: { showtimeId: input.showtimeId },
                include: { seat: true },
            });
            return showtimeSeats.map((s) => ({
                id: s.seatId,
                row: s.seat.row,
                number: s.seat.number,
                isBooked: !isShowtimeSeatAvailable(s, ctx.user.id, now),
            }));
        }),
});
