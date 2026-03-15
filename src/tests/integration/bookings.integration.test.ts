import { beforeEach, describe, expect, it, vi } from "vitest";
import { BookingStep, BookingStatus, TicketStatus } from "@prisma/client";
import { createCaller } from "~/server/api/root";
import { db } from "~/server/db";

vi.mock("~/env", () => ({
    env: {
        BOOKING_CANCEL_WINDOW_MINUTES: 60,
    },
}));

describe("Booking Session Integration Tests", () => {
    beforeEach(async () => {
        await db.ticket.deleteMany();
        await db.booking.deleteMany();
        await db.bookingSession.deleteMany();
        await db.showtimeSeat.deleteMany();
        await db.showtime.deleteMany();
        await db.seat.deleteMany();
        await db.movie.deleteMany();
        await db.user.deleteMany();
    });

    it("should complete a booking successfully from a valid checkout session", async () => {
        const user = await db.user.create({
            data: {
                email: "testuser@example.com",
                name: "Test User",
            },
        });

        const movie = await db.movie.create({
            data: {
                title: "Interstellar",
                posterUrl: "https://example.com/interstellar.jpg",
                runtime: 169,
                tmdbId: 157336,
                releaseDate: new Date("2014-11-07"),
            },
        });

        const showtime = await db.showtime.create({
            data: {
                movieId: movie.id,
                startTime: new Date("2030-04-01T18:00:00Z"),
                endTime: new Date("2030-04-01T20:49:00Z"),
                price: "12.50",
            },
        });

        const seat1 = await db.seat.create({
            data: {
                row: 1,
                number: 1,
            },
        });

        const seat2 = await db.seat.create({
            data: {
                row: 1,
                number: 2,
            },
        });

        const showtimeSeat1 = await db.showtimeSeat.create({
            data: {
                showtimeId: showtime.id,
                seatId: seat1.id,
                isBooked: false,
                heldByUserId: user.id,
                heldTill: new Date("2030-04-01T17:45:00Z"),
            },
        });

        const showtimeSeat2 = await db.showtimeSeat.create({
            data: {
                showtimeId: showtime.id,
                seatId: seat2.id,
                isBooked: false,
                heldByUserId: user.id,
                heldTill: new Date("2030-04-01T17:45:00Z"),
            },
        });

        const session = await db.bookingSession.create({
            data: {
                userId: user.id,
                showtimeId: showtime.id,
                step: BookingStep.CHECKOUT,
                ticketCount: 2,
                expiresAt: new Date("2030-04-01T18:00:00Z"),
                selectedSeats: {
                    connect: [
                        { id: showtimeSeat1.id },
                        { id: showtimeSeat2.id },
                    ],
                },
            },
            include: {
                selectedSeats: true,
            },
        });

        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user,
        });

        await caller.bookingSession.update({
            sessionId: session.id,
            goToStep: BookingStep.COMPLETED,
        });

        const updatedSession = await db.bookingSession.findUniqueOrThrow({
            where: { id: session.id },
        });

        expect(updatedSession.step).toBe(BookingStep.COMPLETED);

        const booking = await db.booking.findFirst({
            where: {
                userId: user.id,
                showtimeId: showtime.id,
            },
            include: {
                tickets: true,
            },
        });

        expect(booking).not.toBeNull();
        expect(booking?.status).toBe(BookingStatus.CONFIRMED);
        expect(Number(booking?.totalAmount)).toBe(25);
        expect(booking?.tickets).toHaveLength(2);

        for (const ticket of booking!.tickets) {
            expect(ticket.status).toBe(TicketStatus.VALID);
            expect(Number(ticket.price)).toBe(12.5);
        }

        const updatedSeats = await db.showtimeSeat.findMany({
            where: {
                id: {
                    in: [showtimeSeat1.id, showtimeSeat2.id],
                },
            },
        });

        expect(updatedSeats).toHaveLength(2);

        for (const seat of updatedSeats) {
            expect(seat.isBooked).toBe(true);
            expect(seat.heldByUserId).toBeNull();
            expect(seat.heldTill).toBeNull();
        }
    });

    it("should reject booking creation when the selected seats are already booked or unavailable", async () => {
        const now = new Date();
        const showtimeStart = new Date(now.getTime() + 2 * 60 * 60 * 1000);
        const showtimeEnd = new Date(now.getTime() + 5 * 60 * 60 * 1000);
        const expiresAt = new Date(now.getTime() + 20 * 60 * 1000);

        const user = await db.user.create({
            data: {
                email: "testuser@example.com",
                name: "Test User",
            },
        });

        const otherUser = await db.user.create({
            data: {
                email: "otheruser@example.com",
                name: "Other User",
            },
        });

        const movie = await db.movie.create({
            data: {
                title: "Dune: Part Two",
                posterUrl: "https://example.com/dune2.jpg",
                runtime: 166,
                tmdbId: 693134,
                releaseDate: new Date("2024-03-01"),
                description: "Paul Atreides unites with Chani and the Fremen.",
            },
        });

        const showtime = await db.showtime.create({
            data: {
                movieId: movie.id,
                startTime: showtimeStart,
                endTime: showtimeEnd,
                price: "12.50",
            },
        });

        const seat1 = await db.seat.create({
            data: {
                row: 1,
                number: 1,
            },
        });

        const seat2 = await db.seat.create({
            data: {
                row: 1,
                number: 2,
            },
        });

        // seat1 is unavailable because it is already booked
        await db.showtimeSeat.create({
            data: {
                showtimeId: showtime.id,
                seatId: seat1.id,
                isBooked: true,
            },
        });

        // seat2 is unavailable because it is still held by another user
        await db.showtimeSeat.create({
            data: {
                showtimeId: showtime.id,
                seatId: seat2.id,
                isBooked: false,
                heldByUserId: otherUser.id,
                heldTill: new Date(now.getTime() + 15 * 60 * 1000),
            },
        });

        const session = await db.bookingSession.create({
            data: {
                userId: user.id,
                showtimeId: showtime.id,
                step: BookingStep.SEAT_SELECTION,
                ticketCount: 2,
                expiresAt,
            },
        });

        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user,
        });

        await expect(
            caller.bookingSession.update({
                sessionId: session.id,
                goToStep: BookingStep.CHECKOUT,
                selectedSeatIds: [seat1.id, seat2.id],
            })
        ).rejects.toThrow(
            "Some selected seats are no longer available. Please choose different seats."
        );

        const updatedSession = await db.bookingSession.findUniqueOrThrow({
            where: { id: session.id },
            include: { selectedSeats: true },
        });

        expect(updatedSession.step).toBe(BookingStep.SEAT_SELECTION);
        expect(updatedSession.selectedSeats).toHaveLength(0);

        const unavailableSeats = await db.showtimeSeat.findMany({
            where: {
                showtimeId: showtime.id,
            },
        });

        expect(unavailableSeats).toHaveLength(2);

        const bookedSeat = unavailableSeats.find((s) => s.seatId === seat1.id);
        const heldSeat = unavailableSeats.find((s) => s.seatId === seat2.id);

        expect(bookedSeat?.isBooked).toBe(true);

        expect(heldSeat?.isBooked).toBe(false);
        expect(heldSeat?.heldByUserId).toBe(otherUser.id);
        expect(heldSeat?.heldTill).not.toBeNull();
    });

    it("should cancel a confirmed booking successfully within the allowed cancellation window", async () => {
        const now = new Date();
        const showtimeStart = new Date(now.getTime() + 3 * 60 * 60 * 1000);
        const showtimeEnd = new Date(now.getTime() + 6 * 60 * 60 * 1000);

        const user = await db.user.create({
            data: {
                email: "testuser@example.com",
                name: "Test User",
            },
        });

        const movie = await db.movie.create({
            data: {
                title: "Dune: Part Two",
                posterUrl: "https://example.com/dune2.jpg",
                runtime: 166,
                tmdbId: 693134,
                releaseDate: new Date("2024-03-01"),
            },
        });

        const showtime = await db.showtime.create({
            data: {
                movieId: movie.id,
                startTime: showtimeStart,
                endTime: showtimeEnd,
                price: "12.50",
            },
        });

        const seat1 = await db.seat.create({
            data: { row: 1, number: 1 },
        });

        const seat2 = await db.seat.create({
            data: { row: 1, number: 2 },
        });

        const showtimeSeat1 = await db.showtimeSeat.create({
            data: {
                showtimeId: showtime.id,
                seatId: seat1.id,
                isBooked: true,
            },
        });

        const showtimeSeat2 = await db.showtimeSeat.create({
            data: {
                showtimeId: showtime.id,
                seatId: seat2.id,
                isBooked: true,
            },
        });

        const booking = await db.booking.create({
            data: {
                userId: user.id,
                showtimeId: showtime.id,
                totalAmount: "25.00",
                status: BookingStatus.CONFIRMED,
            },
        });

        await db.ticket.createMany({
            data: [
                {
                    bookingId: booking.id,
                    showtimeSeatId: showtimeSeat1.id,
                    price: "12.50",
                    status: TicketStatus.VALID,
                },
                {
                    bookingId: booking.id,
                    showtimeSeatId: showtimeSeat2.id,
                    price: "12.50",
                    status: TicketStatus.VALID,
                },
            ],
        });

        const caller = createCaller({
            headers: new Headers(),
            db,
            supabaseUser: null,
            user,
        });

        await caller.bookings.cancel({
            bookingId: booking.id,
        });

        const updatedBooking = await db.booking.findUniqueOrThrow({
            where: { id: booking.id },
        });

        expect(updatedBooking.status).toBe(BookingStatus.CANCELLED);

        const updatedTickets = await db.ticket.findMany({
            where: { bookingId: booking.id },
        });

        expect(updatedTickets).toHaveLength(2);
        for (const ticket of updatedTickets) {
            expect(ticket.status).toBe(TicketStatus.CANCELLED);
        }

        const updatedSeats = await db.showtimeSeat.findMany({
            where: {
                id: {
                    in: [showtimeSeat1.id, showtimeSeat2.id],
                },
            },
        });

        expect(updatedSeats).toHaveLength(2);
        for (const seat of updatedSeats) {
            expect(seat.isBooked).toBe(false);
        }
    });
});
