import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import MovieDetailsPage from "./page";

//Mocking Next.js components and utilities
vi.mock("next/image", () => ({
    __esModule: true,
    default: ({ alt = "", src }: any) => (
        <div
            role="img"
            aria-label={alt}
            data-src={typeof src === "string" ? src : src?.src}
        />
    ),
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: any) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

vi.mock("~/components/ui/badge", () => ({
    Badge: ({ children }: any) => <div data-testid="badge">{children}</div>,
}));

vi.mock("~/components/ui/button", () => ({
    Button: ({ children }: any) => <div data-testid="button">{children}</div>,
}));

vi.mock("~/components/ui/separator", () => ({
    Separator: () => <hr data-testid="separator" />,
}));

vi.mock("~/components/ui/card", () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardContent: ({ children }: any) => (
        <div data-testid="card-content">{children}</div>
    ),
}));

vi.mock("~/lib/utils", () => ({
    formatRuntime: vi.fn(() => "MOCKED RUNTIME"),
    formatDate: vi.fn(() => "MOCKED DATE"),
    formatRating: vi.fn(() => "MOCKED RATING"),
    formatList: vi.fn((v: string | null) =>
        v ? v.split(",").map((s) => s.trim()) : []
    ),
}));

//Mocking database access
const findUniqueMock = vi.fn();

vi.mock("~/server/db", () => ({
    db: {
        movie: {
            findUnique: (...args: any[]) => findUniqueMock(...args),
        },
    },
}));

//Tests for MovieDetailsPage component
describe("MovieDetailsPage", () => {
    beforeEach(() => {
        findUniqueMock.mockReset();
    });

    // Test case: Movie details render correctly
    it("renders movie details correctly", async () => {
        findUniqueMock.mockResolvedValue({
            id: "11",
            title: "How to make a killing",
            description:
                "A dark comedy about bad decisions with worse consequences.",
            runtime: 115,
            rating: 7.2,
            releaseDate: new Date("2024-08-10T00:00:00.000Z"),
            posterUrl: "/posters/how-to-make-a-killing.jpg",
            backdropUrl: "/backdrops/how-to-make-a-killing.jpg",
            trailerUrl: "https://example.com/trailer",
            genres: "Comedy, Crime",
            languages: "English, French",
            cast: "Actor One, Actor Two",
            directors: "Director One",
        });

        const ui = await MovieDetailsPage({
            params: Promise.resolve({ movieId: "11" }),
        });

        render(ui);

        // Movie title and description
        expect(screen.getByText("Movie Details")).toBeInTheDocument();
        expect(
            screen.getByRole("heading", { name: "How to make a killing" })
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "A dark comedy about bad decisions with worse consequences."
            )
        ).toBeInTheDocument();

        // Poster image is rendered with correct src
        expect(
            screen.getByRole("img", { name: "How to make a killing poster" })
        ).toBeInTheDocument();

        expect(screen.getByText("Runtime: MOCKED RUNTIME")).toBeInTheDocument();
        expect(screen.getByText("Rating: MOCKED RATING")).toBeInTheDocument();
        expect(screen.getByText("Release: MOCKED DATE")).toBeInTheDocument();

        const ticketsLink = screen.getByRole("link", { name: "Get Tickets" });
        expect(ticketsLink).toHaveAttribute("href", "/movies/11/showtimes");

        // Trailer link
        const trailerLink = screen.getByRole("link", { name: "Watch Trailer" });
        expect(trailerLink).toHaveAttribute(
            "href",
            "https://example.com/trailer"
        );

        // Genres, languages, directors, and cast are rendered correctly
        expect(screen.getByText("Genres")).toBeInTheDocument();
        expect(screen.getByText("Comedy")).toBeInTheDocument();
        expect(screen.getByText("Crime")).toBeInTheDocument();

        expect(screen.getByText("Languages")).toBeInTheDocument();
        expect(screen.getByText("English")).toBeInTheDocument();
        expect(screen.getByText("French")).toBeInTheDocument();

        expect(screen.getByText("Directors")).toBeInTheDocument();
        expect(screen.getByText("Director One")).toBeInTheDocument();

        expect(screen.getByText("Cast")).toBeInTheDocument();
        expect(screen.getByText("Actor One")).toBeInTheDocument();
        expect(screen.getByText("Actor Two")).toBeInTheDocument();

        expect(findUniqueMock).toHaveBeenCalledWith({ where: { id: "11" } });
    });
});
