import { notFound } from "next/navigation";
import MovieDetails from "../_components/MovieDetails";
import { db } from "~/server/db";

const splitList = (value: string | null) =>
    value
        ? value
              .split(",")
              .map((item) => item.trim())
              .filter(Boolean)
        : [];

interface MovieDetailsPageProps {
    params: Promise<{ movieId: string }>;
}

export default async function MovieDetailsPage({
    params,
}: MovieDetailsPageProps) {
    const { movieId } = await params;
    const movie = await db.movie.findUnique({
        where: { id: movieId },
    });

    if (!movie) {
        notFound();
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
