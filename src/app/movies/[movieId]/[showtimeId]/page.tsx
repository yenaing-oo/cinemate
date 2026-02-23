import { notFound } from "next/navigation";
import { splitList } from "~/lib/utils";
import TicketSelection from "./ticketSelection";
import { db } from "~/server/db";

interface MovieShowtimePageProps {
    params: Promise<{ movieId: string; showtimeId: string }>;
}

export default async function MovieShowtimePage({
    params,
}: MovieShowtimePageProps) {
    const { movieId, showtimeId } = await params;

    // Fetch showtimeID from DB to verify its existence

    // if DB not found, return not found page:
    // if (!showtimeId) {
    //     notFound();
    // }

    const movie = await db.movie.findUnique({
        where: { id: movieId },
    });

    if (!movie) {
        notFound();
    }

    const { title, posterUrl, backdropUrl, languages } = {
        title: movie.title,
        posterUrl: movie.posterUrl ?? "",
        backdropUrl: movie.backdropUrl ?? "",
        languages: splitList(movie.languages),
    };

    console.log("movieID: ", movieId);
    console.log("showtimeID: ", showtimeId);
    return (
        <TicketSelection
            props={{
                backdropUrl: backdropUrl,
                posterUrl: posterUrl,
                title: title,
                languages: languages,
                movieId: movieId,
                showtimeId: showtimeId,
            }}
        />
    );
}
