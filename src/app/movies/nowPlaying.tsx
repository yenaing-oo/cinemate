"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { formatRuntime, splitList } from "~/lib/utils";
import { api } from "~/trpc/react";

export default function NowPlaying() {
    const router = useRouter();
    const [search, setSearch] = useState("");

    const nowPlayingQuery = api.movies.nowPlaying.useQuery({});
    const movies = nowPlayingQuery.data ?? [];
    const isLoading = nowPlayingQuery.isLoading;
    const hasError = nowPlayingQuery.isError;

    const filteredMovies = movies.filter((movie) =>
        movie.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full">
            {/* Header */}
            <h3 className="mb-6 text-4xl font-bold">Now Playing</h3>

            {/* Search + Select Date */}
            <div className="mb-16 flex flex-col gap-4 md:flex-row">
                {/* Search */}
                <input
                    type="text"
                    placeholder="Search movies"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-border/60 bg-card/60 text-foreground ring-border/50 placeholder:text-muted-foreground/70 focus:ring-primary flex-1 rounded-full border px-6 py-3 text-sm ring-1 backdrop-blur-xl outline-none focus:ring-2"
                />

                {/* Select Date */}
                <div
                    onClick={() => router.push("/selectDates")}
                    className="border-border/60 bg-card/60 text-muted-foreground ring-border/50 flex flex-1 cursor-pointer items-center justify-between rounded-full border px-6 py-3 text-sm ring-1 backdrop-blur-xl"
                >
                    <span>Select a date</span>

                    <svg
                        width="18"
                        height="18"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        className="opacity-70"
                    >
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                    </svg>
                </div>
            </div>

            {/* Movies Grid */}
            {isLoading ? (
                <p className="text-muted-foreground">Loading movies...</p>
            ) : hasError ? (
                <p className="text-muted-foreground">Failed to load movies.</p>
            ) : filteredMovies.length === 0 ? (
                <p className="text-muted-foreground">No movies found.</p>
            ) : (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                    {filteredMovies.map((movie) => {
                        const genres = splitList(movie.genres);

                        const genre =
                            genres.length > 0
                                ? genres.slice(0, 2).join(" · ")
                                : "Genre unavailable";

                        const duration = formatRuntime(movie.runtime);

                        const poster =
                            movie.posterUrl ?? "/posters/placeholder.png";

                        return (
                            <Link
                                key={movie.id}
                                href={`/movies/${movie.id}`}
                                className="block"
                            >
                                <Card className="lift-card border-border/60 bg-card/60 hover:bg-card/80 border transition">
                                    <CardContent className="p-4">
                                        <div className="relative mb-3 aspect-2/3 overflow-hidden rounded-lg">
                                            <Image
                                                src={poster}
                                                alt={movie.title}
                                                fill
                                                className="object-cover transition-transform duration-300 hover:scale-105"
                                            />
                                        </div>

                                        <h4 className="truncate font-semibold">
                                            {movie.title}
                                        </h4>

                                        <p className="text-muted-foreground text-sm">
                                            {genre}
                                        </p>

                                        <p className="text-muted-foreground/70 text-xs">
                                            {duration}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
