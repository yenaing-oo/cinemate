"use client";

import { useState } from "react";

const movies = [
  { title: "Spider-Man: No Way Home", genre: "Action · Adventure", duration: "2h 28m" },
  { title: "Jumanji", genre: "Adventure · Comedy", duration: "1h 59m" },
  { title: "2012", genre: "Action · Sci-Fi", duration: "2h 38m" },
  { title: "Passengers", genre: "Sci-Fi · Romance", duration: "1h 56m" },
];

export default function NowPlaying() {
  const [search, setSearch] = useState("");

  const filteredMovies = movies.filter((movie) =>
    movie.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-12 flex flex-col gap-6">
        <h3 className="text-4xl font-bold">Now Playing</h3>

        <input
          type="text"
          placeholder="Search movies"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
            w-full max-w-md rounded-full
            bg-black/40 px-6 py-3
            text-sm text-white
            placeholder-white/50
            backdrop-blur-xl
            ring-1 ring-white/10
            outline-none
            focus:ring-2 focus:ring-red-600
          "
        />
      </div>

      {/* Grid */}
      {filteredMovies.length === 0 ? (
        <p className="text-white/60">No movies found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredMovies.map((movie) => (
            <div
              key={movie.title}
              className="group relative overflow-hidden rounded-xl bg-white/5 transition hover:scale-[1.03] hover:bg-white/10"
            >
              <div className="relative h-64">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="flex h-full items-center justify-center text-white/30">
                  Poster
                </div>
              </div>

              <div className="p-4">
                <h4 className="truncate text-lg font-semibold">{movie.title}</h4>
                <p className="text-sm text-white/70">{movie.genre}</p>
                <p className="text-xs text-white/50">{movie.duration}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
