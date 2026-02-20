import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const bookingsRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const bookings = await ctx.db.booking.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        showtime: {
          include: {
            movie: true,
          },
        },
        tickets: {
          include: {
            seat: true,
          },
        },
      },
    });
    return bookings; 
  }),
});