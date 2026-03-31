import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/server/db", () => {
    return {
        db: {
            movie: {
                findUnique: vi.fn(),
            },
            showtimeSeat: {
                count: vi.fn(),
            },
        },
    };
});

import { showtimesRouter } from "~/server/api/routers/showtimes";
import { db } from "~/server/db";

describe("showtimesRouter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns showtimes for a movie and calls db.movie.findUnique with correct where + select", async () => {
        const movieId = "movie123";

        (db.movie.findUnique as any).mockResolvedValue({
            id: movieId,
            title: "Dune",
            posterUrl: "https://example.com/dune.jpg",
            showtimes: [
                {
                    id: "showtime1",
                    startTime: new Date("2026-06-01T20:30:00Z"),
                    price: 12.5,
                },
            ],
        });

        const result = await showtimesRouter
            .createCaller({} as any)
            .getByMovie({ movieId });

        expect(result).not.toBeNull();
        expect(result!.movie.id).toBe(movieId);
        expect(result!.movie.title).toBe("Dune");
        expect(result!.movie.posterUrl).toBe("https://example.com/dune.jpg");
        expect(result!.showtimes).toHaveLength(1);
        expect(result!.showtimes[0]!.id).toBe("showtime1");
        expect(result!.showtimes[0]!.price).toBe(12.5);

        expect(db.movie.findUnique).toHaveBeenCalledTimes(1);
        expect(db.movie.findUnique).toHaveBeenCalledWith({
            where: { id: movieId },
            select: {
                id: true,
                title: true,
                posterUrl: true,
                showtimes: {
                    where: {
                        startTime: { gt: expect.any(Date) },
                    },
                    orderBy: { startTime: "asc" },
                    select: {
                        id: true,
                        startTime: true,
                        price: true,
                    },
                },
            },
        });
    });

    it("returns null when movie is not found", async () => {
        const movieId = "nonexistentMovie";
        (db.movie.findUnique as any).mockResolvedValue(null);

        const result = await showtimesRouter
            .createCaller({} as any)
            .getByMovie({ movieId });

        expect(result).toBeNull();
        expect(db.movie.findUnique).toHaveBeenCalledTimes(1);
        expect(db.movie.findUnique).toHaveBeenCalledWith({
            where: { id: movieId },
            select: {
                id: true,
                title: true,
                posterUrl: true,
                showtimes: {
                    where: {
                        startTime: { gt: expect.any(Date) },
                    },
                    orderBy: { startTime: "asc" },
                    select: {
                        id: true,
                        startTime: true,
                        price: true,
                    },
                },
            },
        });
    });

    it("returns empty showtimes array when movie has no upcoming showtimes", async () => {
        const movieId = "movieWithNoShowtimes";

        (db.movie.findUnique as any).mockResolvedValue({
            id: movieId,
            title: "Movie with No Showtimes",
            posterUrl: "https://example.com/no-showtimes.jpg",
            showtimes: [],
        });

        const result = await showtimesRouter
            .createCaller({} as any)
            .getByMovie({ movieId });

        expect(result).not.toBeNull();
        expect(result!.movie.id).toBe(movieId);
        expect(result!.showtimes).toEqual([]);

        expect(db.movie.findUnique).toHaveBeenCalledTimes(1);
        expect(db.movie.findUnique).toHaveBeenCalledWith({
            where: { id: movieId },
            select: {
                id: true,
                title: true,
                posterUrl: true,
                showtimes: {
                    where: {
                        startTime: { gt: expect.any(Date) },
                    },
                    orderBy: { startTime: "asc" },
                    select: {
                        id: true,
                        startTime: true,
                        price: true,
                    },
                },
            },
        });
    });

    it("returns available seat count for a showtime and calls db.showtimeSeat.count with correct where", async () => {
        const showtimeId = "showtime123";

        (db.showtimeSeat.count as any).mockResolvedValue(42);

        const result = await showtimesRouter
            .createCaller({
                user: {
                    id: "user123",
                },
            } as any)
            .getAvailableSeatCount({ showtimeId });

        expect(result).toBe(42);
        expect(db.showtimeSeat.count).toHaveBeenCalledTimes(1);
        expect(db.showtimeSeat.count).toHaveBeenCalledWith({
            where: {
                showtimeId,
                isBooked: false,
                OR: [
                    { heldTill: null },
                    { heldTill: { lt: expect.any(Date) } },
                    { heldByUserId: "user123" },
                ],
            },
        });
    });
});
