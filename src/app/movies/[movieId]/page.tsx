import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import {
    formatDate,
    formatRating,
    formatRuntime,
    splitList,
} from "~/lib/utils";
import { db } from "~/server/db";

interface MovieDetailsPageProps {
    params: Promise<{ movieId: string }>;
}

const DetailBlock = ({
    label,
    items,
    fallback,
}: {
    label: string;
    items: string[];
    fallback: string;
}) => {
    return (
        <div className="space-y-2">
            <p className="text-muted-foreground/80 text-xs font-semibold tracking-[0.2em] uppercase">
                {label}
            </p>
            {items.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                        <span
                            key={`${label}-${item}`}
                            className="border-border/60 bg-muted/40 rounded-full border px-3 py-1 text-xs"
                        >
                            {item}
                        </span>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-sm">{fallback}</p>
            )}
        </div>
    );
};

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

    const {
        title,
        description,
        runtime,
        rating,
        releaseDate,
        posterUrl,
        backdropUrl,
        trailerUrl,
        genres,
        languages,
        cast,
        directors,
    } = {
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

    return (
        <section className="full-bleed relative -mt-24 min-h-screen overflow-hidden">
            <div className="absolute inset-0">
                {backdropUrl || posterUrl ? (
                    <Image
                        src={backdropUrl || posterUrl}
                        alt=""
                        fill
                        sizes="100vw"
                        className="object-cover"
                        priority
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
                )}
            </div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(32,201,255,0.28),transparent_45%),radial-gradient(circle_at_85%_10%,rgba(255,181,92,0.22),transparent_40%)]" />
            <div className="from-background/95 via-background/70 to-background/10 absolute inset-0 bg-gradient-to-r" />
            <div className="from-background/90 via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 pt-28 pb-20">
                <div className="grid items-end gap-10 lg:grid-cols-[360px_1fr]">
                    <div className="relative">
                        <div className="from-primary/20 via-secondary/10 to-accent/20 absolute -inset-4 rounded-[28px] bg-gradient-to-br blur-2xl" />
                        <Card className="border-border/60 bg-muted/20 relative overflow-hidden rounded-[28px] border shadow-[0_30px_80px_rgba(5,12,24,0.55)]">
                            <CardContent className="p-0">
                                {posterUrl ? (
                                    <div className="relative h-[520px] w-full">
                                        <Image
                                            src={posterUrl}
                                            alt={`${title} poster`}
                                            fill
                                            sizes="(min-width: 1024px) 360px, 80vw"
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="bg-muted/40 text-muted-foreground flex h-[520px] items-center justify-center px-6 text-center text-sm">
                                        Poster not available
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className="text-muted-foreground/70 text-xs font-semibold tracking-[0.45em] uppercase">
                                Movie Details
                            </p>
                            <h1 className="mt-3 text-4xl leading-tight font-bold md:text-5xl">
                                {title}
                            </h1>
                            <p className="text-muted-foreground mt-5 max-w-2xl text-base leading-relaxed">
                                {description ||
                                    "No description is available for this movie yet."}
                            </p>
                        </div>

                        <Separator className="bg-border/70" />

                        <div className="flex flex-wrap gap-3">
                            <Badge variant="outline">
                                Runtime: {formatRuntime(runtime)}
                            </Badge>
                            <Badge variant="outline">
                                Rating: {formatRating(rating)}
                            </Badge>
                            <Badge variant="outline">
                                Release: {formatDate(releaseDate)}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button asChild size="lg" className="font-semibold">
                                <Link href={`/movies/${movieId}/showtimes`}>
                                    Get Tickets
                                </Link>
                            </Button>
                            {trailerUrl ? (
                                <Button asChild variant="outline" size="lg">
                                    <a
                                        href={trailerUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                    >
                                        Watch Trailer
                                    </a>
                                </Button>
                            ) : null}
                        </div>

                        <Card className="glass-panel rounded-2xl">
                            <CardContent className="space-y-6 p-6">
                                <div className="grid gap-6 md:grid-cols-2">
                                    <DetailBlock
                                        label="Genres"
                                        items={genres}
                                        fallback="Genres not available"
                                    />
                                    <DetailBlock
                                        label="Languages"
                                        items={languages}
                                        fallback="Languages not available"
                                    />
                                    <DetailBlock
                                        label="Directors"
                                        items={directors}
                                        fallback="Directors not available"
                                    />
                                    <DetailBlock
                                        label="Cast"
                                        items={cast}
                                        fallback="Cast list not available"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
