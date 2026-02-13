const formatRuntime = (runtime: number) => {
    if (!Number.isFinite(runtime) || runtime <= 0) return "Runtime unavailable";
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
};

const formatRating = (rating: number | null) => {
    if (rating === null || !Number.isFinite(rating)) return "Not rated";
    return `${rating.toFixed(1)} / 10`;
};

const formatDate = (date: string | Date) =>
    new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    });

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

export default function MovieDetails({
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
}: {
    title: string;
    description: string;
    runtime: number;
    rating: number | null;
    releaseDate: string | Date;
    posterUrl: string;
    backdropUrl: string;
    trailerUrl: string;
    genres: string[];
    languages: string[];
    cast: string[];
    directors: string[];
}) {
    return (
        <section className="full-bleed relative min-h-screen overflow-hidden">
            <div className="absolute inset-0">
                {backdropUrl || posterUrl ? (
                    <img
                        src={backdropUrl ?? posterUrl ?? ""}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
                )}
            </div>
            <div className="from-background/95 via-background/70 to-background/10 absolute inset-0 bg-gradient-to-r" />
            <div className="from-background/90 via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-end px-6 pt-24 pb-16">
                <div className="grid items-end gap-10 lg:grid-cols-[360px_1fr]">
                    <div className="relative">
                        <div className="from-primary/20 via-secondary/10 to-accent/20 absolute -inset-4 rounded-[28px] bg-gradient-to-br blur-2xl" />
                        <div className="border-border/60 bg-muted/20 relative overflow-hidden rounded-[28px] border shadow-[0_30px_80px_rgba(5,12,24,0.55)]">
                            {posterUrl ? (
                                <img
                                    src={posterUrl}
                                    alt={`${title} poster`}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <div className="bg-muted/40 text-muted-foreground flex h-[520px] items-center justify-center px-6 text-center text-sm">
                                    Poster not available
                                </div>
                            )}
                        </div>
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

                        <div className="flex flex-wrap gap-3">
                            <span className="border-border/60 bg-muted/40 rounded-full border px-4 py-1 text-xs font-semibold">
                                Runtime: {formatRuntime(runtime)}
                            </span>
                            <span className="border-border/60 bg-muted/40 rounded-full border px-4 py-1 text-xs font-semibold">
                                Rating: {formatRating(rating)}
                            </span>
                            <span className="border-border/60 bg-muted/40 rounded-full border px-4 py-1 text-xs font-semibold">
                                Release: {formatDate(releaseDate)}
                            </span>
                        </div>

                        {trailerUrl ? (
                            <div>
                                <a
                                    href={trailerUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn-primary"
                                >
                                    Watch Trailer
                                </a>
                            </div>
                        ) : null}

                        <div className="glass-panel space-y-6 rounded-2xl p-6">
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
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
