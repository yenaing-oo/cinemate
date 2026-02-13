import MovieDetails from "../_components/MovieDetails";
import { db } from "~/server/db";

const splitList = (value: string | null) =>
    value
        ? value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
        : [];

export default async function MovieSamplePage() {
    const movie = await db.movie.findFirst({
        orderBy: { releaseDate: "desc" },
    });

    if (!movie) {
        return (
            <section className="mx-auto w-full max-w-4xl px-6 py-20 text-center">
                <h1 className="text-2xl font-semibold">No movies found yet</h1>
                <p className="text-muted-foreground mt-3 text-sm">
                    Run <span className="font-semibold">pnpm sync:movies</span>{" "}
                    to fetch movie data from TMDB into the database.
                </p>
            </section>
        );
    }

    const movieDetails = {
        title: movie.title,
        description: movie.description ?? "",
        runtime: movie.runtime,
        rating: movie.rating ?? null,
        releaseDate: movie.releaseDate.toISOString(),
        posterUrl: movie.posterUrl ?? "",
        backdropUrl: movie.backdropUrl ?? "",
        trailerUrl: movie.trailerUrl ?? "",
        genres: splitList(movie.genres),
        languages: splitList(movie.languages),
        cast: splitList(movie.cast),
        directors: splitList(movie.directors),
    };

    return <MovieDetails {...movieDetails} />;
}
