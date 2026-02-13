import NowPlaying from "./nowPlaying";
import { db } from "~/server/db";

export default async function MoviesPage() {
    const movie = await db.movie.findFirst({
        select: { id: true },
        orderBy: { releaseDate: "desc" },
    });

    return (
        <section className="mx-auto max-w-7xl px-6 py-20">
            <NowPlaying movieId={movie?.id} />
        </section>
    );
}
