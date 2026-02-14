import NowPlaying from "./nowPlaying";
import { getNowPlayingMovies } from "~/lib/utils";
import { db } from "~/server/db";

export default async function MoviesPage() {
    const movies = await getNowPlayingMovies(db);

    return (
        <section className="mx-auto max-w-7xl px-6 py-20">
            <NowPlaying movies={movies} />
        </section>
    );
}
