import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import NowPlaying from "./nowPlaying";

//Mocking Next.js components and utilities
vi.mock("next/image", () => ({
    default: (props: any) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img alt={props.alt} src={props.src} />;
    },
}));

vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: any) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}));

vi.mock("~/components/ui/card", () => ({
    Card: ({ children }: any) => <div data-testid="card">{children}</div>,
    CardContent: ({ children }: any) => (
        <div data-testid="card-content">{children}</div>
    ),
}));

vi.mock("~/lib/utils", async (importOriginal) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const actual = await importOriginal<typeof import("~/lib/utils")>();
    return {
        ...actual,
        splitList: vi.fn((v: string | null) =>
            v ? v.split(",").map((s) => s.trim()) : []
        ),
        formatRuntime: vi.fn(() => "2h 10m"),
    };
});

const mockUseQuery = vi.fn();

vi.mock("~/trpc/react", () => ({
    api: {
        movies: {
            nowPlaying: {
                useQuery: (...args: any[]) => mockUseQuery(...args),
            },
        },
    },
}));

//Tests for NowPlaying component
describe("NowPlaying", () => {
    beforeEach(() => {
        mockUseQuery.mockReset();
    });

    // Test cases
    // 1. Loading state
    it("renders loading state", () => {
        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
        });

        render(<NowPlaying />);

        expect(screen.getByText("Now Playing")).toBeInTheDocument();
        expect(screen.getByText("Loading movies...")).toBeInTheDocument();
    });

    // 2. Error state
    it("renders error state", () => {
        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        });

        render(<NowPlaying />);

        expect(screen.getByText("Failed to load movies.")).toBeInTheDocument();
    });

    // 3. Successful data rendering
    it("renders movies when query succeeds (poster, title, link)", () => {
        mockUseQuery.mockReturnValue({
            data: [
                {
                    id: "1",
                    title: "How to Make a Killing",
                    genres: "Drama, Thriller",
                    runtime: 169,
                    posterUrl: "/posters/how-to-make-a-killing.jpg",
                },
            ],
            isLoading: false,
            isError: false,
        });

        render(<NowPlaying />);

        // Title
        expect(screen.getByText("How to Make a Killing")).toBeInTheDocument();

        // Image (poster)
        const img = screen.getByRole("img", { name: "How to Make a Killing" });
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute(
            "src",
            "/posters/how-to-make-a-killing.jpg"
        );

        // Link to movie page
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", "/movies/1");

        // Genre + runtime text are rendered (runtime is mocked)
        expect(screen.getByText("Drama · Thriller")).toBeInTheDocument();
        expect(screen.getByText("2h 10m")).toBeInTheDocument();
    });

    // 4. Search functionality
    it("filters movies by search input", () => {
        mockUseQuery.mockReturnValue({
            data: [
                {
                    id: "1",
                    title: "How to Make a Killing",
                    genres: "Drama, Thriller",
                    runtime: 169,
                    posterUrl: null,
                },
                {
                    id: "2",
                    title: "Inception",
                    genres: "Sci-Fi, Action",
                    runtime: 148,
                    posterUrl: null,
                },
            ],
            isLoading: false,
            isError: false,
        });

        render(<NowPlaying />);

        const input = screen.getByPlaceholderText("Search movies");
        fireEvent.change(input, { target: { value: "how" } });

        expect(screen.getByText("How to Make a Killing")).toBeInTheDocument();
        expect(screen.queryByText("Inception")).toBeNull();
    });
});
