import { describe, it, expect, vi, beforeEach } from "vitest";
import { showtimeSeatsRouter } from "./showtimeSeats";

vi.mock("~/server/db", () => {
    return {
        db: {
            showtimeSeat: {
                findMany: vi.fn(),
            },
        },
    };
});

import { db } from "~/server/db";

//Tests for showtimeSeatsRouter, specifically the getByShowtime procedure and its use of isShowtimeSeatAvailable
describe("showtimeSeatsRouter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Test case: getByShowtime returns showtime seats with correct availability status based on isShowtimeSeatAvailable logic
    it("returns showtime seats with correct availability status", async () => {
        // Arrange
        const showtimeId = "showtime123";
        const userId = "user123";
        const now = new Date();
        (db.showtimeSeat.findMany as any).mockResolvedValue([
            {
                seatId: "seat1",
                seat: { row: 1, number: 1 },
                isBooked: false,
                heldTill: null,
                heldByUserId: null,
            },
            {
                seatId: "seat2",
                seat: { row: 1, number: 2 },
                isBooked: true,
                heldTill: null,
                heldByUserId: null,
            },
            {
                seatId: "seat3",
                seat: { row: 1, number: 3 },
                isBooked: false,
                heldTill: new Date(now.getTime() + 60 * 1000), // held for 1 more minute
                heldByUserId: userId,
            },
        ]);

        expect(
            await showtimeSeatsRouter
                .createCaller({ user: { id: userId } } as any)
                .getByShowtime({ showtimeId })
        ).toEqual([
            {
                id: "seat1",
                row: 1,
                number: 1,
                isBooked: false,
            },
            {
                id: "seat2",
                row: 1,
                number: 2,
                isBooked: true,
            },
            {
                id: "seat3",
                row: 1,
                number: 3,
                isBooked: false,
            },
        ]);
    });
});
