import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchNowPlaying, fetchMovieFull } from "./tmdb";

function mockFetchObject(opts: {
    ok?: boolean;
    status?: number;
    jsonData?: any;
    textData?: string;
}) {
    return {
        ok: opts.ok ?? true,
        status: opts.status ?? 200,
        json: vi.fn().mockResolvedValue(opts.jsonData),
        text: vi
            .fn()
            .mockResolvedValue(opts.textData ?? JSON.stringify(opts.jsonData)),
    } as any;
}

describe("fetchNowPlaying", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("fetches and parses now playing movies when status is OK", async () => {
        // Arrange
        const validTMDBResponse = {
            results: [
                {
                    id: 1,
                    title: "Dune",
                    overview: "Sci-fi epic",
                    release_date: "2024-03-01",
                    poster_path: "/poster.jpg",
                },
            ],
            page: 1,
            total_pages: 10,
            total_results: 100,
        };

        globalThis.fetch = vi.fn().mockResolvedValue(
            mockFetchObject({
                ok: true,
                status: 200,
                jsonData: validTMDBResponse,
            })
        ) as any;

        const result = await fetchNowPlaying();
        expect(result.results[0]!.id).toBe(1);
        expect(result.results[0]!.title).toBe("Dune");
        expect(result.page).toBe(1);
        expect(result.total_pages).toBe(10);
        expect(result.total_results).toBe(100);

        // Assert
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/movie/now_playing"),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: expect.stringContaining("Bearer "),
                }),
            })
        );
    });

    it("throws an error with status and text when response is not OK", async () => {
        // Arrange
        globalThis.fetch = vi.fn().mockResolvedValue(
            mockFetchObject({
                ok: false,
                status: 500,
                textData: "Internal Server Error",
            })
        ) as any;

        await expect(fetchNowPlaying()).rejects.toThrow(
            "TMDB fetch failed: 500"
        );
    });
});

describe("fetchMovieFull", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it("fetches and parses full movie details when status is OK", async () => {
        // Arrange
        const validTMDBResponse = {
            id: 1,
            overview: "Sci-fi epic",
            release_date: "2024-03-01",
            runtime: 155,
            vote_average: 8.5,
            backdrop_path: "/backdrop.jpg",
            genres: [{ name: "Sci-Fi" }],
            spoken_languages: [{ english_name: "English" }],
            credits: {
                cast: [{ name: "Timothée Chalamet" }],
                crew: [{ job: "Director", name: "Denis Villeneuve" }],
            },
            videos: {
                results: [
                    {
                        site: "YouTube",
                        type: "Trailer",
                        key: "trailerkey123",
                    },
                ],
            },
        };

        globalThis.fetch = vi.fn().mockResolvedValue(
            mockFetchObject({
                ok: true,
                status: 200,
                jsonData: validTMDBResponse,
            })
        ) as any;

        const result = await fetchMovieFull(1);
        expect(result.overview).toBe("Sci-fi epic");
        expect(result.release_date).toBe("2024-03-01");
        expect(result.runtime).toBe(155);
        expect(result.vote_average).toBe(8.5);
        expect(result.backdrop_path).toBe("/backdrop.jpg");
        expect(result.genres?.[0]!.name).toBe("Sci-Fi");
        expect(result.spoken_languages?.[0]!.english_name).toBe("English");
        expect(result.credits?.cast?.[0]!.name).toBe("Timothée Chalamet");
        expect(result.credits?.crew?.[0]!.job).toBe("Director");
        expect(result.credits?.crew?.[0]!.name).toBe("Denis Villeneuve");
        expect(result.videos?.results?.[0]!.site).toBe("YouTube");
        expect(result.videos?.results?.[0]!.type).toBe("Trailer");
        expect(result.videos?.results?.[0]!.key).toBe("trailerkey123");

        // Assert
        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/movie/1"),
            expect.objectContaining({
                headers: expect.objectContaining({
                    Authorization: expect.stringContaining("Bearer "),
                }),
            })
        );
    });

    it("throws an error with status and text when response is not OK", async () => {
        // Arrange
        globalThis.fetch = vi.fn().mockResolvedValue(
            mockFetchObject({
                ok: false,
                status: 404,
                textData: "Movie not found",
            })
        ) as any;

        await expect(fetchMovieFull(999)).rejects.toThrow(
            "TMDB details fetch failed for 999"
        );
    });
});
