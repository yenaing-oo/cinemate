import { formatRuntime, formatRating } from "./utils";
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
