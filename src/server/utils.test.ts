import { isShowtimeSeatAvailable } from "./utils";
import { describe, it, expect } from "vitest";

describe("isShowtimeSeatAvailable", () => {
    const now = new Date();
    const userId = "user123";
    
    it("returns false if the seat is booked", () => {
        const seat = {
            isBooked: true,
            heldTill: null,
            heldByUserId: null,
        };
        expect(isShowtimeSeatAvailable(seat, userId, now)).toBe(false);
    });

    it("returns true if the seat is not held", () => {
        const seat = {
            isBooked: false,
            heldTill: null,
            heldByUserId: null,
        };
        expect(isShowtimeSeatAvailable(seat, userId, now)).toBe(true);
    });

    it("returns true if the hold has expired", () => {
        const pastDate = new Date(now.getTime() - 60 * 1000);
        const seat = {
            isBooked: false,
            heldTill: pastDate,
            heldByUserId: userId,
        };
        expect(isShowtimeSeatAvailable(seat, userId, now)).toBe(true);
    });

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