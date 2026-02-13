"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";

const movies = [
    {
        title: "Spider-Man: No Way Home",
        genre: "Action · Adventure",
        duration: "2h 28m",
        poster: "/posters/spiderman.jpg",
    },
    {
        title: "Jumanji",
        genre: "Adventure · Comedy",
        duration: "1h 59m",
        poster: "/posters/jumanji.jpg",
    },
    {
        title: "2012",
        genre: "Action · Sci-Fi",
        duration: "2h 38m",
        poster: "/posters/2012.jpg",
    },
    {
        title: "Passengers",
        genre: "Sci-Fi · Romance",
        duration: "1h 56m",
        poster: "/posters/passengers.jpg",
    },
];

export default function NowPlaying({
    movieId,
}: {
    movieId?: string | null;
}) {
    const [search, setSearch] = useState("");
    const movieHref = movieId ? `/movies/${movieId}` : "/movies";

    const filteredMovies = movies.filter((movie) =>
        movie.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-10 flex flex-col gap-6">
                <h3 className="text-4xl font-bold">Now Playing</h3>

                <input
                    type="text"
                    placeholder="Search movies"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="border-border/60 bg-card/60 text-foreground placeholder:text-muted-foreground/70 ring-border/50 focus:ring-primary w-full max-w-md rounded-full border px-6 py-3 text-sm ring-1 backdrop-blur-xl outline-none focus:ring-2"
                />
            </div>

            {/* Grid */}
            {filteredMovies.length === 0 ? (
                <p className="text-muted-foreground">No movies found.</p>
            ) : (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                    {filteredMovies.map((movie) => (
                        <Link
                            key={movie.title}
                            href={movieHref}
                            className="block"
                        >
                            <Card className="lift-card border-border/60 bg-card/60 hover:bg-card/80 border transition">
                                <CardContent className="p-4">
                                    <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-lg">
                                        <Image
                                            src={movie.poster}
                                            alt={movie.title}
                                            fill
                                            className="object-cover transition-transform duration-300 hover:scale-105"
                                        />
                                    </div>

                                    <h4 className="truncate font-semibold">
                                        {movie.title}
                                    </h4>
                                    <p className="text-muted-foreground text-sm">
                                        {movie.genre}
                                    </p>
                                    <p className="text-muted-foreground/70 text-xs">
                                        {movie.duration}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
