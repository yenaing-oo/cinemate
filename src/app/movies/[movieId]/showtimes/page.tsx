"use client";

import { useSearchParams } from "next/navigation";
import type { JSXElementConstructor, Key, ReactElement, ReactNode, ReactPortal } from "react";
import { api } from "~/trpc/react";

export default function ShowtimesPage() {

  const searchParams = useSearchParams();

  const movieId = searchParams.get("movieId");
  const date = searchParams.get("date");

  const { data: showtimes, isLoading } =
    api.showtime.getShowtimesByMovieAndDate.useQuery(
      {
        movieId: movieId ?? "",
        date: date ?? "",
      },
      {
        enabled: !!movieId && !!date,
      }
    );

  if (!movieId || !date) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        Please select a movie and date first.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        Loading showtimes...
      </div>
    );
  }

  if (!showtimes || showtimes.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        No showtimes found.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">

      <h2 className="text-3xl font-bold mb-6">
        Showtimes
      </h2>

      <p className="mb-8 text-muted-foreground">
        {new Date(date).toDateString()}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">

        {showtimes.map((showtime: { startTime: string | number | Date; id: Key | null | undefined; movie: { title: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }; }) => {

          const time =
            new Date(showtime.startTime)
              .toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });

          return (
            <div
              key={showtime.id}
              className="border border-border/60 bg-card/60 p-4 rounded-xl hover:bg-card/80 transition cursor-pointer"
            >

              <div className="font-semibold">
                {showtime.movie.title}
              </div>

              <div className="text-muted-foreground text-sm mt-1">
                {time}
              </div>

            </div>
          );

        })}

      </div>

    </div>
  );
}
