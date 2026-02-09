import Image from "next/image";
import Link from "next/link";
import { auth } from "~/server/auth";
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

export default async function Home() {
    const session = await auth();
    void api.example.hello.prefetch({ text: "from tRPC" });

    return (
        <HydrateClient>
            <>
                <link
                    rel="stylesheet"
                    href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
                />

                <main
                    className="text-white"
                    style={{
                        background:
                            "radial-gradient(circle at 10% 0%, rgba(72,214,255,0.2), rgba(7,13,24,0) 42%), radial-gradient(circle at 88% 18%, rgba(255,181,92,0.16), rgba(7,13,24,0) 38%), #070d18",
                    }}
                >
                    {/* HERO */}
                    <section
                        className="position-relative overflow-hidden"
                        style={{ minHeight: "82vh" }}
                    >
                        <video
                            autoPlay
                            muted
                            loop
                            playsInline
                            className="position-absolute object-fit-cover start-0 top-0 h-100 w-100"
                        >
                            <source
                                src="/video/homepage.mp4"
                                type="video/mp4"
                            />
                        </video>

                        <div
                            className="position-absolute start-0 top-0 h-100 w-100"
                            style={{
                                background:
                                    "linear-gradient(180deg, rgba(6,11,22,0.35), rgba(6,11,22,0.95))",
                            }}
                        />

                        {/* HERO CONTENT */}
                        <div className="position-relative z-2 container">
                            <div
                                className="row justify-content-center text-center"
                                style={{
                                    minHeight: "70vh",
                                    paddingTop: "8rem",
                                }}
                            >
                                <div className="col-lg-8">
                                    <h2 className="fw-bold display-4">
                                        Make it a movie night.
                                    </h2>
                                    <p className="lead mt-3">
                                        One organizer, many payers, one smooth
                                        booking flow.
                                    </p>
                                </div>
                            </div>

                            {/* TONIGHT SHOWTIMES : Hard code for now */}
                            <div className="row g-3 pb-5">
                                {todayShowtimes.map((show) => (
                                    <div
                                        key={show.title}
                                        className="col-md-6 col-xl-3 col-12"
                                    >
                                        <div
                                            className="rounded-4 h-100 p-4"
                                            style={{
                                                border: "1px solid rgba(132,206,255,0.25)",
                                                background:
                                                    "linear-gradient(180deg, rgba(12,28,50,0.78), rgba(12,28,50,0.55))",
                                                backdropFilter: "blur(8px)",
                                            }}
                                        >
                                            <p className="fw-semibold text-info mb-2">
                                                Tonight
                                            </p>
                                            <h3 className="h6 fw-semibold mb-2">
                                                {show.title}
                                            </h3>
                                            <p className="mb-0 text-white/80">
                                                {show.details}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* NOW PLAYING : Hard code for now */}
                    <section className="mx-auto max-w-7xl px-6 py-20">
                        <div className="mb-10 flex items-center justify-between">
                            <h3 className="text-3xl font-bold">Now Playing</h3>
                            <Link
                                href="/movies"
                                className="text-sm text-blue-400 hover:text-blue-300"
                            >
                                View all →
                            </Link>
                        </div>

                        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4">
                            {nowPlaying.map((movie) => (
                                <Link
                                    key={movie.title}
                                    href={`/movies/${encodeURIComponent(movie.title)}`}
                                    className="block rounded-xl bg-white/5 p-4 transition hover:bg-white/10"
                                >
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
                                    <p className="text-sm text-white/70">
                                        {movie.genre}
                                    </p>
                                    <p className="text-xs text-white/50">
                                        {movie.duration}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </section>
                </main>
            </>
        </HydrateClient>
    );
}
