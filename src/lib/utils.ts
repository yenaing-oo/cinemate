import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

type DbClient = typeof import("~/server/db").db;

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatRuntime = (runtime: number) => {
    if (!Number.isFinite(runtime) || runtime <= 0) return "Runtime unavailable";
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
};

export const formatRating = (rating: number | null) => {
    if (rating === null || !Number.isFinite(rating)) return "Not rated";
    return `${rating.toFixed(1)} / 10`;
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Chicago",
});

export const formatDate = (date: string | Date) =>
    dateFormatter.format(new Date(date));

export const splitList = (value: string | null) =>
    value
        ? value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
        : [];

export type NowPlayingMovie = {
    id: string;
    title: string;
    genre: string;
    duration: string;
    poster: string;
};

export async function getNowPlayingMovies(
    db: DbClient,
    options?: { limit?: number }
): Promise<NowPlayingMovie[]> {
    const limit = options?.limit;
    const hasLimit = typeof limit === "number";
    const movies = await db.movie.findMany({
        select: {
            id: true,
            title: true,
            genres: true,
            runtime: true,
            posterUrl: true,
        },
        orderBy: { releaseDate: "desc" },
        ...(hasLimit ? { take: limit } : {}),
    });

    return movies.map((movie) => {
        const genres = splitList(movie.genres);
        return {
            id: movie.id,
            title: movie.title,
            genre:
                genres.length > 0
                    ? genres.slice(0, 2).join(" · ")
                    : "Genre unavailable",
            duration: formatRuntime(movie.runtime),
            poster: movie.posterUrl ?? "/posters/spiderman.jpg",
        };
    });
}
