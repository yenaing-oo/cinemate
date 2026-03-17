import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("fetches and parses now playing movies when status is OK", async () => {
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

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

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

        expect(logSpy).toHaveBeenCalledWith("Fetching now playing movies");

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            "https://api.themoviedb.org/3/movie/now_playing?language=en-US&region=CA&page=1",
            {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );
    });

    it("throws an error with status and text when response is not OK", async () => {
        const errorSpy = vi
            .spyOn(console, "error")
            .mockImplementation(() => {});

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

        expect(errorSpy).toHaveBeenCalledWith("TMDB STATUS:", 500);
        expect(errorSpy).toHaveBeenCalledWith(
            "TMDB RESPONSE:",
            "Internal Server Error"
        );
    });
});

describe("fetchMovieFull", () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("fetches and parses full movie details when status is OK", async () => {
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

        const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

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

        expect(logSpy).toHaveBeenCalledWith("Fetching details for TMDB ID:", 1);

        expect(globalThis.fetch).toHaveBeenCalledTimes(1);
        expect(globalThis.fetch).toHaveBeenCalledWith(
            "https://api.themoviedb.org/3/movie/1?append_to_response=credits%2Cvideos&language=en-US",
            {
                headers: {
                    Authorization: `Bearer ${process.env.TMDB_ACCESS_TOKEN}`,
                    "Content-Type": "application/json",
                },
            }
        );
    });

    it("throws an error with status and text when response is not OK", async () => {
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
