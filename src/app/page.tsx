import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { formatRuntime, splitList } from "~/lib/utils";
import { api, HydrateClient } from "~/trpc/server";

const watchPartySteps = [
    {
        id: "plan",
        kicker: "Step 01",
        title: "Set the plan",
        details: "Pick a time and place that works for everyone.",
    },
    {
        id: "invite",
        kicker: "Step 02",
        title: "Invite the group",
        details: "Invite your friends so everyone can join fast.",
    },
    {
        id: "split",
        kicker: "Step 03",
        title: "Split payments",
        details: "Everyone pays their share without extra hassle.",
    },
    {
        id: "sync",
        kicker: "Step 04",
        title: "Confirmation Email",
        details:
            "Automatic Email with booking details will be sent to all participants.",
    },
];

export default async function Home() {
    const nowPlayingRaw = await api.movies.nowPlaying({ limit: 4 });
    const nowPlaying = nowPlayingRaw.map((movie) => {
        const genres = splitList(movie.genres);
        return {
            id: movie.id,
            title: movie.title,
            genre:
                genres.length > 0
                    ? genres.slice(0, 2).join(" · ")
                    : "Genre unavailable",
            duration: formatRuntime(movie.runtime),
            poster: movie.posterUrl ?? "/posters/placeholder.png",
        };
    });

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

                        {/* WATCH PARTY STEPS */}
                        <div className="mt-21 grid gap-3 pb-3 md:grid-cols-2 xl:grid-cols-4">
                            {watchPartySteps.map((step) => (
                                <div key={step.id}>
                                    <Card className="glass-card lift-card h-full rounded-2xl shadow-none">
                                        <CardContent className="p-4">
                                            <p className="text-primary mb-2 text-sm font-semibold">
                                                {step.kicker}
                                            </p>
                                            <h3 className="mb-2 text-base font-semibold">
                                                {step.title}
                                            </h3>
                                            <p className="text-muted-foreground text-sm">
                                                {step.details}
                                            </p>
                                        </CardContent>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

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
