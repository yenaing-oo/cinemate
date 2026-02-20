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

export default function MoviesPage() {
    const [search, setSearch] = useState("");

    const filteredMovies = movies.filter((movie) =>
        movie.title.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <main className="container py-5 text-white">
            {/* NOW PLAYING HEADER */}
            <h2 className="fw-bold mb-4">Now Playing</h2>

            {/* SEARCH + DATE (SIDE BY SIDE) */}
            <div className="d-flex mb-5 flex-wrap gap-3">
                {/* SEARCH */}
                <input
                    type="text"
                    placeholder="Search movies"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="rounded-pill px-4 py-3 text-white"
                    style={{
                        flex: "1 1 360px",
                        background: "rgba(0,0,0,0.4)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        outline: "none",
                    }}
                />

                {/* DATE PICKER */}
                <Link
                    href="/selectDates"
                    className="text-decoration-none text-white"
                    style={{ flex: "1 1 360px" }}
                >
                    <div
                        className="rounded-pill d-flex justify-content-between align-items-center h-100 px-4 py-3"
                        style={{
                            background: "rgba(0,0,0,0.4)",
                            border: "1px solid rgba(255,255,255,0.15)",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    fontSize: "0.7rem",
                                    letterSpacing: "0.14em",
                                    opacity: 0.65,
                                }}
                            >
                                DATE
                            </div>
                            <div className="fw-medium">
                                Wednesday, Feb 11, 2026
                            </div>
                        </div>

                        {/* calendar icon */}
                        <svg
                            width="20"
                            height="20"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <rect x="3" y="4" width="18" height="18" rx="2" />
                            <line x1="16" y1="2" x2="16" y2="6" />
                            <line x1="8" y1="2" x2="8" y2="6" />
                        </svg>
                    </div>
                </Link>
            </div>

            {/* MOVIE GRID */}
            {filteredMovies.length === 0 ? (
                <p style={{ opacity: 0.6 }}>No movies found.</p>
            ) : (
                <div className="row g-4">
                    {filteredMovies.map((movie) => (
                        <div key={movie.title} className="col-md-3 col-6">
                            <Link
                                href={`/movies/${encodeURIComponent(movie.title)}`}
                                className="text-decoration-none text-white"
                            >
                                <div
                                    className="rounded-4 h-100 p-3"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                    }}
                                >
                                    <div
                                        className="position-relative mb-3"
                                        style={{ aspectRatio: "2 / 3" }}
                                    >
                                        <Image
                                            src={movie.poster}
                                            alt={movie.title}
                                            fill
                                            className="rounded-3 object-fit-cover"
                                        />
                                    </div>

                                    <div className="fw-semibold text-truncate">
                                        {movie.title}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.9rem",
                                            opacity: 0.7,
                                        }}
                                    >
                                        {movie.genre}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.8rem",
                                            opacity: 0.5,
                                        }}
                                    >
                                        {movie.duration}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </main>
    );
}
