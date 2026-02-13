import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { api, HydrateClient } from "~/trpc/server";

const todayShowtimes = [
    {
        title: "2012",
        details: "6:15 PM • Dolby Atmos",
    },
    {
        title: "Jumanji: The Next Level",
        details: "7:40 PM • Dolby Atmos",
    },
    {
        title: "Spider Man: No Way Home",
        details: "9:05 PM • 3D + Dolby Atmos",
    },
    {
        title: "The Batman",
        details: "10:30 PM • 3D",
    },
];

const nowPlaying = [
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

// Test statements to verify build does not fail due to missing env vars in CI
const movies = db.movie.findMany();
console.log("Movies from DB:", movies);
console.log(process.env.DATABASE_URL);

export default async function Home() {
    return (
        <HydrateClient>
            <>
                {/* HERO */}
                <section className="full-bleed relative -mt-24 min-h-screen overflow-hidden">
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="absolute inset-0 h-full w-full object-cover"
                    >
                        <source src="/video/homepage.mp4" type="video/mp4" />
                    </video>

                    <div className="hero-overlay absolute inset-0" />

                    {/* HERO CONTENT */}
                    <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
                        <div className="flex min-h-[70vh] flex-col items-center justify-center pt-16 text-center md:pt-24">
                            <div className="max-w-3xl">
                                <h2 className="text-4xl font-bold md:text-5xl">
                                    Make it a movie night.
                                </h2>
                                <p className="text-muted-foreground mt-3 text-lg md:text-xl">
                                    One organizer, many payers, one smooth
                                    booking flow.
                                </p>
                            </div>
                        </div>

                        {/* TONIGHT SHOWTIMES : Hard code for now */}
                        <div className="mt-21 grid gap-3 pb-3 md:grid-cols-2 xl:grid-cols-4">
                            {todayShowtimes.map((show) => (
                                <div key={show.title}>
                                    <Card className="glass-card lift-card h-full rounded-2xl shadow-none">
                                        <CardContent className="p-4">
                                            <p className="text-primary mb-2 text-sm font-semibold">
                                                Tonight
                                            </p>
                                            <h3 className="mb-2 text-base font-semibold">
                                                {show.title}
                                            </h3>
                                            <p className="text-muted-foreground text-sm">
                                                {show.details}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* NOW PLAYING : Hard code for now */}
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
                                key={movie.title}
                                href={`/movies/${encodeURIComponent(movie.title)}`}
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
