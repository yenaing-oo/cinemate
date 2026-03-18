import Image from "next/image";
import Link from "next/link";
import HomeHero from "~/app/components/HomeHero";
import { Card, CardContent } from "~/components/ui/card";
import { formatRuntime, formatList } from "~/lib/utils";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
    const nowPlayingRaw = await api.movies.nowPlaying({ limit: 8 });
    const movies = nowPlayingRaw.map((movie) => {
        const genres = formatList(movie.genres);
        return {
            id: movie.id,
            title: movie.title,
            description:
                movie.description?.trim() ||
                "Reserve seats, split payments, and get everyone into the same show without the group-chat chaos.",
            genre:
                genres.length > 0
                    ? genres.slice(0, 2).join(" · ")
                    : "Genre unavailable",
            duration: formatRuntime(movie.runtime),
            poster: movie.posterUrl ?? "/posters/placeholder.png",
            backdrop:
                movie.backdropUrl ??
                movie.posterUrl ??
                "/posters/placeholder.png",
        };
    });
    const nowPlaying = movies.slice(0, 4);
    const featuredMovies =
        movies.length > 4 ? movies.slice(4, 8) : movies.slice(0, 4);

    return (
        <HydrateClient>
            <>
                <HomeHero movies={featuredMovies} />

                {/* NOW PLAYING */}
                <section className="pt-10 pb-16">
                    <div className="mb-10 flex items-center justify-between">
                        <h3 className="text-3xl font-bold">Now Playing</h3>
                        <Link
                            href="/movies"
                            className="text-primary hover:text-primary/80 text-sm transition"
                        >
                            View all →
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                        {nowPlaying.map((movie) => (
                            <Link
                                key={movie.id}
                                href={`/movies/${movie.id}`}
                                className="block"
                            >
                                <Card className="lift-card border-border/60 bg-card/60 hover:bg-card/80 rounded-xl border transition">
                                    <CardContent className="p-4">
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
                                        <p className="text-muted-foreground text-sm">
                                            {movie.genre}
                                        </p>
                                        <p className="text-muted-foreground/70 text-xs">
                                            {movie.duration}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </section>

            </>
        </HydrateClient>
    );
}
