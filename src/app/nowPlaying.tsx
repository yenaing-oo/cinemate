"use client";

import { useState } from "react";

const movies = [
    {
        title: "Spider-Man: No Way Home",
        genre: "Action · Adventure",
        duration: "2h 28m",
    },
    {
        title: "Jumanji",
        genre: "Adventure · Comedy",
        duration: "1h 59m",
    },
    {
        title: "2012",
        genre: "Action · Sci-Fi",
        duration: "2h 38m",
    },
    {
        title: "Passengers",
        genre: "Sci-Fi · Romance",
        duration: "1h 56m",
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
                <h3 className="text-3xl font-bold">Now Playing</h3>

                {/* Search Bar */}
                <div className="relative w-full max-w-md">
                    <input
                        type="text"
                        placeholder="Search movies"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="
                            w-full rounded-full
                            bg-white/10
                            px-5 py-3
                            text-sm text-white
                            placeholder-white/50
                            backdrop-blur-md
                            outline-none
                            ring-1 ring-white/20
                            transition
                            focus:ring-2 focus:ring-red-600
                        "
                    />
                </div>
            </div>

            {/* Movie Grid */}
            {filteredMovies.length === 0 ? (
                <p className="text-white/60">No movies found.</p>
            ) : (
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {filteredMovies.map((movie) => (
                        <div
                            key={movie.title}
                            className="
                                rounded-lg
                                bg-white/5
                                p-4
                                transition
                                hover:bg-white/10
                            "
                        >
                            <div className="mb-3 flex h-56 w-full items-center justify-center rounded-md bg-white/10 text-white/40">
                                Poster
                            </div>

                            <h4 className="truncate text-lg font-semibold">
                                {movie.title}
                            </h4>
                            <p className="text-sm text-white/70">
                                {movie.genre}
                            </p>
                            <p className="text-sm text-white/50">
                                {movie.duration}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
