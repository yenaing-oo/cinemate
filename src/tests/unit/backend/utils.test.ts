import { cn, formatBookingNumber } from "../../../lib/utils";
describe("cn", () => {
    it("merges class names", () => {
        expect(cn("foo", "bar")).toContain("foo");
        expect(cn("foo", "bar")).toContain("bar");
    });
    it("handles empty and falsy values", () => {
        expect(cn("foo", null, undefined, false, "bar")).toContain("foo");
        expect(cn("foo", null, undefined, false, "bar")).toContain("bar");
    });
});

describe("formatBookingNumber", () => {
    it("formats booking number with leading zeros", () => {
        expect(formatBookingNumber(1)).toBe("#000001");
        expect(formatBookingNumber(123)).toBe("#000123");
        expect(formatBookingNumber(123456)).toBe("#123456");
    });
});
describe("formatList", () => {
    it("splits, trims, and filters a comma-separated string", () => {
        expect(formatList("a, b, ,c ,  d")).toEqual(["a", "b", "c", "d"]);
    });
    it("returns an empty array for null", () => {
        expect(formatList(null)).toEqual([]);
    });
    it("trims all items and filters out empty", () => {
        expect(formatList("  x, , y ,z  , ")).toEqual(["x", "y", "z"]);
    });
});

describe("formatSeatFromCode", () => {
    it("formats valid row and seat", () => {
        expect(formatSeatFromCode(1, 5)).toBe("A5");
        expect(formatSeatFromCode(2, 10)).toBe("B10");
    });
    it("throws for non-integer row", () => {
        expect(() => formatSeatFromCode(1.5, 2)).toThrow(
            "Invalid seat: row and seat must be positive integers"
        );
    });
    it("throws for non-integer seat", () => {
        expect(() => formatSeatFromCode(2, 2.2)).toThrow(
            "Invalid seat: row and seat must be positive integers"
        );
    });
    it("throws for row <= 0", () => {
        expect(() => formatSeatFromCode(0, 2)).toThrow(
            "Invalid seat: row and seat must be positive integers"
        );
    });
    it("throws for seat <= 0", () => {
        expect(() => formatSeatFromCode(2, 0)).toThrow(
            "Invalid seat: row and seat must be positive integers"
        );
    });
});

describe("formatTime", () => {
    it("formats ms to M:SS", () => {
        expect(formatTime(65000)).toBe("1:05");
        expect(formatTime(0)).toBe("0:00");
    });
    it("never returns negative time", () => {
        expect(formatTime(-1000)).toBe("0:00");
    });
});
import {
    formatRuntime,
    formatRating,
    formatShowtimeDate,
    formatShowtimeTime,
    formatList,
    formatSeatFromCode,
    formatTime,
} from "../../../lib/utils";
import { describe, it, expect, vi } from "vitest";

vi.mock("~/env.mjs", () => ({
    env: {
        NODE_ENV: "test",
        NEXT_PUBLIC_CINEMA_TIMEZONE: "America/Winnipeg",
    },
}));

describe("formatRuntime", () => {
    it("formats runtime in hours and minutes", () => {
        expect(formatRuntime(165)).toBe("2h 45m");
    });

    it("formats runtime in hours only when minutes are zero", () => {
        expect(formatRuntime(180)).toBe("3h");
    });
    it("formats runtime in minutes only when hours are zero", () => {
        expect(formatRuntime(45)).toBe("45m");
    });
    it("formats runtime in hours and minutes (edge)", () => {
        expect(formatRuntime(61)).toBe("1h 1m");
    });
    it("returns 'Runtime unavailable' for NaN", () => {
        expect(formatRuntime(NaN)).toBe("Runtime unavailable");
    });
    it("returns 'Runtime unavailable' for Infinity", () => {
        expect(formatRuntime(Infinity)).toBe("Runtime unavailable");
    });
    it("returns 'Runtime unavailable' for negative runtime", () => {
        expect(formatRuntime(-10)).toBe("Runtime unavailable");
    });
    it("returns 'Runtime unavailable' for zero runtime", () => {
        expect(formatRuntime(0)).toBe("Runtime unavailable");
    });
});

describe("formatRating", () => {
    it("formats rating to one decimal place", () => {
        expect(formatRating(7.456)).toBe("7.5 / 10");
    });
    it("returns 'Not rated' for null or non-finite values", () => {
        expect(formatRating(null)).toBe("Not rated");
        expect(formatRating(NaN)).toBe("Not rated");
        expect(formatRating(Infinity)).toBe("Not rated");
    });
    it("returns formatted rating for finite non-null values", () => {
        expect(formatRating(8)).toBe("8.0 / 10");
        expect(formatRating(0)).toBe("0.0 / 10");
        expect(formatRating(-1)).toBe("-1.0 / 10");
        expect(formatRating(5)).not.toBe("Not rated");
    });
});

//FEATURE 2
describe("formatShowtimeTime", () => {
    it("formats showtime to 'h:mm A' format in America/Winnipeg timezone", () => {
        const date = new Date("2024-06-01T20:30:00Z"); // 3:30 PM in Winnipeg
        expect(formatShowtimeTime(date)).toBe("3:30 PM");
    });
});

describe("formatShowtimeDate", () => {
    it("formats showtime date to 'Month Day, Year' format in America/Winnipeg timezone", () => {
        const date = new Date("2024-06-01T20:30:00Z"); // June 1, 2024 in Chicago
        expect(formatShowtimeDate(date)).toBe("June 1, 2024");
    });
});
