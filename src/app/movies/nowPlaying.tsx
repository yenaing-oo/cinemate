"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

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

export default function NowPlaying() {
    const [search, setSearch] = useState("");

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
                    className="w-full max-w-md rounded-full border border-border/60 bg-card/60 px-6 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 ring-1 ring-border/50 backdrop-blur-xl outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            {/* Grid – SAME AS HOME PAGE */}
            {filteredMovies.length === 0 ? (
                <p className="text-muted-foreground">No movies found.</p>
            ) : (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                    {filteredMovies.map((movie) => (
                        <Link
                            key={movie.title}
                            href={`/movies/${encodeURIComponent(movie.title)}`}
                            className="lift-card block rounded-xl border border-border/60 bg-card/60 p-4 transition hover:bg-card/80"
                        >
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
                            <p className="text-sm text-muted-foreground">
                                {movie.genre}
                            </p>
                            <p className="text-xs text-muted-foreground/70">
                                {movie.duration}
                            </p>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
