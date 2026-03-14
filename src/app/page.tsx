import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { formatRuntime, formatList } from "~/lib/utils";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
    const nowPlayingRaw = await api.movies.nowPlaying({ limit: 4 });
    const nowPlaying = nowPlayingRaw.map((movie) => {
        const genres = formatList(movie.genres);
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

                <section className="pb-8">
                    <div className="glass-panel overflow-hidden rounded-[2rem] border border-white/10">
                        <div className="grid gap-10 px-6 py-10 md:grid-cols-[1.15fr_0.85fr] md:px-10 md:py-12">
                            <div className="space-y-6">
                                <div className="inline-flex rounded-full border border-cyan-300/25 bg-cyan-300/10 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-100 uppercase">
                                    Watch Party
                                </div>
                                <div className="space-y-4">
                                    <h3 className="max-w-2xl text-3xl font-bold md:text-4xl">
                                        Plan one outing without paying for
                                        everyone yourself.
                                    </h3>
                                    <p className="text-muted-foreground max-w-2xl text-base md:text-lg">
                                        A party leader creates the outing,
                                        invites the group, and completes the
                                        booking flow. Each guest checks out
                                        their own seat separately, so there is
                                        no back-and-forth for reimbursements.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-3">
                                    {[
                                        [
                                            "Leader books the plan",
                                            "Pick the movie, showtime, and seat block for the group.",
                                        ],
                                        [
                                            "Guests confirm themselves",
                                            "Each invitee claims a seat and pays only for their own ticket.",
                                        ],
                                        [
                                            "Everyone stays aligned",
                                            "The party status keeps attendance and payment progress visible.",
                                        ],
                                    ].map(([title, body]) => (
                                        <div
                                            key={title}
                                            className="glass-card rounded-2xl border border-white/10 p-4"
                                        >
                                            <p className="mb-2 text-sm font-semibold text-white">
                                                {title}
                                            </p>
                                            <p className="text-muted-foreground text-sm leading-6">
                                                {body}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-wrap gap-3">
                                    <Link
                                        href="/watch-party"
                                        className="btn-primary"
                                    >
                                        Explore Watch Party
                                    </Link>
                                    <Link
                                        href="/movies"
                                        className="rounded-full border border-white/12 px-4 py-2 font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                                    >
                                        Start with a movie
                                    </Link>
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-cyan-400/20 blur-3xl" />
                                <div className="glass-card relative rounded-[1.75rem] border border-cyan-200/15 p-5">
                                    <div className="mb-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-white">
                                                Friday Watch Party
                                            </p>
                                            <p className="text-muted-foreground text-sm">
                                                6 invited · 4 paid · 2 pending
                                            </p>
                                        </div>
                                        <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-200">
                                            Leader view
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        {[
                                            [
                                                "Create party",
                                                "Movie, time, and seat block chosen",
                                            ],
                                            [
                                                "Invite group",
                                                "Share a join link with friends",
                                            ],
                                            [
                                                "Guests pay",
                                                "Each person checks out only their own seat",
                                            ],
                                            [
                                                "Lock the plan",
                                                "Organizer confirms once the group is ready",
                                            ],
                                        ].map(([step, detail], index) => (
                                            <div
                                                key={step}
                                                className="flex items-start gap-3 rounded-2xl border border-white/8 bg-white/4 p-4"
                                            >
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-cyan-100">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-white">
                                                        {step}
                                                    </p>
                                                    <p className="text-muted-foreground text-sm">
                                                        {detail}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </>
        </HydrateClient>
    );
}
