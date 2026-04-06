"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

const ROTATION_INTERVAL_MS = 10_000;

type HomeHeroMovie = {
    id: string;
    title: string;
    genre: string;
    duration: string;
    poster: string;
    backdrop: string;
    description: string;
};

interface HomeHeroProps {
    movies: HomeHeroMovie[];
}

export default function HomeHero({ movies }: HomeHeroProps) {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        // No need to start the timer if there is only one movie.
        if (movies.length < 2) {
            return;
        }

        const intervalId = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % movies.length);
        }, ROTATION_INTERVAL_MS);

        return () => window.clearInterval(intervalId);
    }, [movies.length]);

    if (movies.length === 0) {
        return (
            <section className="full-bleed -mt-24 bg-black pt-24">
                {/* Show a quiet fallback hero while the movie catalog is empty. */}
                <div className="relative overflow-hidden bg-[radial-gradient(circle_at_18%_20%,rgba(32,201,255,0.22),transparent_38%),radial-gradient(circle_at_82%_8%,rgba(255,181,92,0.18),transparent_32%),linear-gradient(180deg,rgba(7,13,24,0.75),rgba(7,13,24,0.97))]">
                    <div className="mx-auto flex min-h-[260px] w-full max-w-7xl items-end px-6 py-10 md:min-h-[340px]">
                        <div className="max-w-2xl space-y-4">
                            <p className="text-primary text-xs font-semibold tracking-[0.42em] uppercase">
                                Featured Movies
                            </p>
                            <h2 className="text-3xl font-bold md:text-5xl">
                                Fresh picks are on the way.
                            </h2>
                            <p className="text-sm leading-relaxed text-white/78 md:text-base">
                                As soon as new titles are available, this banner
                                will rotate through them automatically.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="bg-[linear-gradient(180deg,#244a77_0%,#142742_100%)]">
                    <div className="mx-auto max-w-7xl px-6 py-3 text-center">
                        <Button
                            asChild
                            size="lg"
                            className="bg-transparent shadow-none hover:bg-transparent"
                        >
                            <Link
                                href="/movies"
                                className="text-lg font-bold tracking-[0.2em] uppercase"
                            >
                                Browse Movies
                            </Link>
                        </Button>
                    </div>
                </div>
            </section>
        );
    }

    // Use the latest list length in case the movie list gets shorter later.
    const safeActiveIndex = activeIndex % movies.length;
    const activeMovie = movies[safeActiveIndex]!;

    return (
        <section className="full-bleed relative -mt-24 overflow-hidden bg-black">
            <div className="absolute inset-0">
                {movies.map((movie, index) => (
                    <div
                        key={movie.id}
                        aria-hidden={index !== safeActiveIndex}
                        className={cn(
                            "absolute inset-0 transition-opacity duration-700",
                            index === safeActiveIndex
                                ? "opacity-100"
                                : "opacity-0"
                        )}
                    >
                        <Image
                            src={movie.backdrop}
                            alt={`${movie.title} background`}
                            fill
                            priority={index === 0}
                            sizes="100vw"
                            className={cn(
                                "object-cover object-center transition-transform duration-[1400ms] ease-out",
                                index === safeActiveIndex
                                    ? "scale-105"
                                    : "scale-100"
                            )}
                        />
                    </div>
                ))}
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(32,201,255,0.24),transparent_36%),radial-gradient(circle_at_82%_14%,rgba(255,181,92,0.2),transparent_34%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[rgba(4,9,18,0.94)] via-[rgba(4,9,18,0.62)] to-[rgba(4,9,18,0.24)]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/18" />
            <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/45 to-transparent" />

            <div className="relative mx-auto flex min-h-[640px] w-full max-w-7xl flex-col justify-end px-6 pt-28 pb-10 md:min-h-[720px] md:pt-32 md:pb-14">
                <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)] lg:gap-12">
                    <div className="max-w-3xl">
                        <p className="text-xs font-semibold tracking-[0.38em] text-white/74 uppercase">
                            Now Showing
                        </p>
                        <h2 className="mt-4 text-4xl leading-none font-extrabold text-white drop-shadow-[0_12px_30px_rgba(0,0,0,0.45)] md:text-6xl lg:text-7xl">
                            {activeMovie.title}
                        </h2>

                        <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/88">
                            <span className="rounded-full border border-white/18 bg-black/28 px-4 py-2 backdrop-blur-sm">
                                {activeMovie.genre}
                            </span>
                            <span className="rounded-full border border-white/18 bg-black/28 px-4 py-2 backdrop-blur-sm">
                                {activeMovie.duration}
                            </span>
                        </div>

                        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/80 md:text-base">
                            {activeMovie.description}
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <Button asChild size="lg" className="font-semibold">
                                <Link
                                    href={`/movies/${activeMovie.id}/showtimes`}
                                >
                                    Get Tickets
                                </Link>
                            </Button>
                            <Button
                                asChild
                                variant="outline"
                                size="lg"
                                className="border-white/20 bg-black/28 text-white shadow-none backdrop-blur-sm hover:bg-black/42 hover:text-white"
                            >
                                <Link href={`/movies/${activeMovie.id}`}>
                                    View Details
                                </Link>
                            </Button>
                        </div>
                    </div>

                    <div className="mx-auto w-full max-w-[220px] justify-self-start lg:mx-0 lg:max-w-[300px] lg:justify-self-end">
                        <div className="relative lg:translate-y-8">
                            <div className="from-primary/34 to-accent/26 absolute -inset-4 rounded-[36px] bg-gradient-to-br via-white/0 blur-2xl" />
                            <div className="relative overflow-hidden rounded-[30px] border border-white/18 bg-white/8 p-3 shadow-[0_30px_80px_rgba(0,0,0,0.48)] backdrop-blur-md">
                                <div className="relative aspect-[2/3] overflow-hidden rounded-[24px] bg-black/30">
                                    <Image
                                        key={activeMovie.id}
                                        src={activeMovie.poster}
                                        alt={`${activeMovie.title} poster`}
                                        fill
                                        sizes="(min-width: 1024px) 300px, (min-width: 768px) 220px, 56vw"
                                        className="object-contain object-center"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Keep manual controls here so users do not need to wait for the auto rotation. */}
                <div className="mt-8 flex flex-wrap items-center gap-3 md:mt-10">
                    <button
                        type="button"
                        aria-label="Previous featured movie"
                        onClick={() =>
                            setActiveIndex(
                                (safeActiveIndex - 1 + movies.length) %
                                    movies.length
                            )
                        }
                        className="flex h-11 min-w-11 items-center justify-center rounded-full border border-white/16 bg-black/28 px-4 text-white backdrop-blur-md transition hover:bg-black/42"
                    >
                        <span className="block text-3xl leading-none">‹</span>
                    </button>

                    <div className="flex items-center gap-3 rounded-full border border-white/16 bg-black/28 px-4 py-3 backdrop-blur-md">
                        {movies.map((movie, index) => (
                            <button
                                key={movie.id}
                                type="button"
                                aria-label={`Show ${movie.title}`}
                                aria-pressed={index === safeActiveIndex}
                                onClick={() => setActiveIndex(index)}
                                className={cn(
                                    "h-2.5 w-2.5 rounded-full transition",
                                    index === safeActiveIndex
                                        ? "bg-white"
                                        : "bg-white/38 hover:bg-white/70"
                                )}
                            />
                        ))}
                    </div>

                    <button
                        type="button"
                        aria-label="Next featured movie"
                        onClick={() =>
                            setActiveIndex(
                                (safeActiveIndex + 1) % movies.length
                            )
                        }
                        className="flex h-11 min-w-11 items-center justify-center rounded-full border border-white/16 bg-black/28 px-4 text-white backdrop-blur-md transition hover:bg-black/42"
                    >
                        <span className="block text-3xl leading-none">›</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
