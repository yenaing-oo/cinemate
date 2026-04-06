import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("~/server/db", () => {
    return {
        db: {
            movie: {
                findMany: vi.fn(),
                findUnique: vi.fn(),
            },
            showtime: {
                findMany: vi.fn(),
            },
        },
    };
});

import { moviesRouter } from "~/server/api/routers/movies";
import { db } from "~/server/db";

describe("moviesRouter", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("returns movies and calls db.movie.findMany with correct select + orderBy when no limit is provided", async () => {
        // Arrange
        (db.movie.findMany as any).mockResolvedValue([
            {
                id: "m1",
                title: "Dune",
                genres: ["Sci-Fi"],
                runtime: 155,
                posterUrl: "https://example.com/dune.jpg",
            },
        ]);

        // Act
        const result = await moviesRouter
            .createCaller({} as any)
            .nowPlaying({});

        // Assert (return value)
        expect(result).toHaveLength(1);
        expect(result[0]!.id).toBe("m1");

        // Assert (Prisma call shape)
        expect(db.movie.findMany).toHaveBeenCalledTimes(1);
        expect(db.movie.findMany).toHaveBeenCalledWith({
            where: {
                releaseDate: {
                    lte: expect.any(Date),
                },
                showtimes: {
                    some: {
                        startTime: {
                            gte: expect.any(Date),
                        },
                    },
                },
            },
            select: {
                id: true,
                title: true,
                genres: true,
                runtime: true,
                posterUrl: true,
                backdropUrl: true,
                description: true,
            },
            orderBy: { releaseDate: "desc" },
            // IMPORTANT: no "take" when limit is undefined
        });
    });

    it("adds take when limit is provided", async () => {
        // Arrange
        (db.movie.findMany as any).mockResolvedValue([]);

        // Act
        await moviesRouter.createCaller({} as any).nowPlaying({ limit: 5 });

        // Assert
        expect(db.movie.findMany).toHaveBeenCalledTimes(1);
        expect(db.movie.findMany).toHaveBeenCalledWith({
            where: {
                releaseDate: {
                    lte: expect.any(Date),
                },
                showtimes: {
                    some: {
                        startTime: {
                            gte: expect.any(Date),
                        },
                    },
                },
            },
            select: {
                id: true,
                title: true,
                genres: true,
                runtime: true,
                posterUrl: true,
                backdropUrl: true,
                description: true,
            },
            orderBy: { releaseDate: "desc" },
            take: 5,
        });
    });

    it("does not add take when limit is undefined", async () => {
        (db.movie.findMany as any).mockResolvedValue([]);

        await moviesRouter.createCaller({} as any).nowPlaying({});

        expect(db.movie.findMany).toHaveBeenCalledTimes(1);

        const callArgs = (db.movie.findMany as any).mock.calls[0][0];
        expect(db.movie.findMany).toHaveBeenCalledWith({
            where: {
                releaseDate: {
                    lte: expect.any(Date),
                },
                showtimes: {
                    some: {
                        startTime: {
                            gte: expect.any(Date),
                        },
                    },
                },
            },
            select: {
                id: true,
                title: true,
                genres: true,
                runtime: true,
                posterUrl: true,
                backdropUrl: true,
                description: true,
            },
            orderBy: { releaseDate: "desc" },
        });
        expect(callArgs).not.toHaveProperty("take");
    });
});
