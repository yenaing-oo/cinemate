import {
    formatRuntime,
    formatRating,
    formatShowtimeDate,
    formatShowtimeTime,
} from "./utils";
import { describe, it, expect } from "vitest";

describe("formatRuntime", () => {
    it("formats runtime in hours and minutes", () => {
        expect(formatRuntime(165)).toBe("2h 45m");
    });

    it("formats runtime in hours only when minutes are zero", () => {
        expect(formatRuntime(180)).toBe("3h");
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
});

//FEATURE 2
describe("formatShowtimeTime", () => {
    it("formats showtime to 'h:mm A' format in America/Winnipeg timezone", () => {
        const date = new Date("2024-06-01T20:30:00Z"); // 3:30 PM in Chicago
        expect(formatShowtimeTime(date)).toBe("8:30 PM");
    });
});

describe("formatShowtimeDate", () => {
    it("formats showtime date to 'Month Day, Year' format in America/Winnipeg timezone", () => {
        const date = new Date("2024-06-01T20:30:00Z"); // June 1, 2024 in Chicago
        expect(formatShowtimeDate(date)).toBe("June 1, 2024");
    });
});
