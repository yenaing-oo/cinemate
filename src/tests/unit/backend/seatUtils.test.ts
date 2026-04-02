import { isShowtimeSeatAvailable } from "~/server/utils";
import { describe, it, expect } from "vitest";

//Tests for utility functions in src/server/utils.ts, specifically isShowtimeSeatAvailable
describe("isShowtimeSeatAvailable", () => {
    const now = new Date();
    const userId = "user123";

    // Test case: Seat is booked
    it("returns false if the seat is booked", () => {
        const seat = {
            isBooked: true,
            heldTill: null,
            heldByUserId: null,
        };
        expect(isShowtimeSeatAvailable(seat, userId, now)).toBe(false);
    });

    // Test case: Seat is not held
    it("returns true if the seat is not held", () => {
        const seat = {
            isBooked: false,
            heldTill: null,
            heldByUserId: null,
        };
        expect(isShowtimeSeatAvailable(seat, userId, now)).toBe(true);
    });

    // Test case: Hold has expired
    it("returns true if the hold has expired", () => {
        const pastDate = new Date(now.getTime() - 60 * 1000);
        const seat = {
            isBooked: false,
            heldTill: pastDate,
            heldByUserId: userId,
        };
        expect(isShowtimeSeatAvailable(seat, userId, now)).toBe(true);
    });

    // Test case: Seat is held by another user and hold has not expired
    it("returns true if the seat is held by the current user", () => {
        const futureDate = new Date(now.getTime() + 60 * 1000);
        const seat = {
            isBooked: false,
            heldTill: futureDate,
            heldByUserId: userId,
        };
        expect(isShowtimeSeatAvailable(seat, userId, now)).toBe(true);
    });
});
