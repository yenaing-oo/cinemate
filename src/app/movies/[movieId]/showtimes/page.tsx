import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { db } from "~/server/db";

interface ShowtimesPageProps {
    params: Promise<{ movieId: string }>;
    searchParams: Promise<{ date?: string; showtimeId?: string }>;
}

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const dateLabelFormatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
});

const timeLabelFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    hour: "numeric",
    minute: "2-digit",
});

const priceFormatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});

export default async function MovieShowtimesPage({
    params,
    searchParams,
}: ShowtimesPageProps) {
    const { movieId } = await params;
    const { date: selectedDateParam, showtimeId } = await searchParams;

    const movie = await db.movie.findUnique({
        where: { id: movieId },
        select: {
            id: true,
            title: true,
            posterUrl: true,
            runtime: true,
            showtimes: {
                select: {
                    id: true,
                    startTime: true,
                    availableSeats: true,
                    price: true,
                },
                orderBy: { startTime: "asc" },
            },
        },
    });

    if (!movie) {
        notFound();
    }

    const groupedShowtimes = new Map<
        string,
        Array<{
            id: string;
            startTime: Date;
            availableSeats: number;
            price: number;
        }>
    >();
    const dateByKey = new Map<string, Date>();

    for (const showtime of movie.showtimes) {
        const key = dateKeyFormatter.format(showtime.startTime);
        const dateShowtimes = groupedShowtimes.get(key) ?? [];
        dateShowtimes.push({
            id: showtime.id,
            startTime: showtime.startTime,
            availableSeats: showtime.availableSeats,
            price: Number(showtime.price),
        });
        groupedShowtimes.set(key, dateShowtimes);
        if (!dateByKey.has(key)) {
            dateByKey.set(key, showtime.startTime);
        }
    }

    const availableDates = Array.from(groupedShowtimes.keys());
    const selectedDate =
        selectedDateParam && groupedShowtimes.has(selectedDateParam)
            ? selectedDateParam
            : availableDates[0];

    const selectedDayShowtimes = selectedDate
        ? (groupedShowtimes.get(selectedDate) ?? [])
        : [];

    const poster = movie.posterUrl ?? "/posters/placeholder.png";

    return (
        <section className="mx-auto w-full max-w-7xl px-6 py-24">
            <div className="mb-8 flex flex-wrap items-center gap-3">
                <Link
                    href={`/movies/${movieId}`}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition"
                >
                    <span aria-hidden="true">←</span>
                    <span>Back to details</span>
                </Link>
            </div>

            <Card className="glass-panel overflow-hidden rounded-3xl border">
                <CardContent className="grid gap-8 p-6 lg:grid-cols-[320px_1fr_300px] lg:p-8">
                    <div className="space-y-4 lg:pt-10">
                        <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-white/10">
                            <Image
                                src={poster}
                                alt={`${movie.title} poster`}
                                fill
                                className="object-cover"
                                sizes="320px"
                            />
                        </div>
                        <h1 className="text-2xl font-bold">{movie.title}</h1>
                    </div>

                    <div className="space-y-5">
                        <div>
                            <h2 className="text-2xl font-semibold md:text-3xl">
                                Choose a showtime
                            </h2>
                        </div>

                        {selectedDayShowtimes.length > 0 ? (
                            <div className="flex flex-wrap gap-3">
                                {selectedDayShowtimes.map((showtime) => {
                                    const isSelected =
                                        showtime.id === showtimeId;
                                    const href = `/movies/${movieId}/showtimes?date=${selectedDate}&showtimeId=${showtime.id}`;

                                    return (
                                        <Button
                                            key={showtime.id}
                                            asChild
                                            variant={
                                                isSelected
                                                    ? "default"
                                                    : "outline"
                                            }
                                            size="lg"
                                            className="min-w-28"
                                        >
                                            <Link href={href}>
                                                {timeLabelFormatter.format(
                                                    showtime.startTime
                                                )}
                                            </Link>
                                        </Button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No showtimes are available for this date yet.
                            </p>
                        )}

                        {showtimeId ? (
                            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm">
                                <p className="font-medium">Selected showtime</p>
                                <p className="text-muted-foreground mt-1">
                                    You selected a time slot. Seat selection is
                                    the next step.
                                </p>
                            </div>
                        ) : null}
                    </div>

                    <div className="space-y-3 lg:pt-3">
                        <p className="text-foreground text-sm font-bold tracking-[0.2em] uppercase">
                            Dates
                        </p>
                        {availableDates.length > 0 ? (
                            <div className="grid gap-3">
                                {availableDates.map((dateKey) => {
                                    const dayShowtimes =
                                        groupedShowtimes.get(dateKey) ?? [];
                                    const firstPrice =
                                        dayShowtimes[0]?.price ?? 0;
                                    const isActive = dateKey === selectedDate;

                                    return (
                                        <Button
                                            key={dateKey}
                                            asChild
                                            variant={
                                                isActive ? "default" : "outline"
                                            }
                                            className="h-auto justify-start py-4"
                                        >
                                            <Link
                                                href={`/movies/${movieId}/showtimes?date=${dateKey}`}
                                            >
                                                <span className="block text-left text-base font-semibold">
                                                    {dateLabelFormatter.format(
                                                        dateByKey.get(
                                                            dateKey
                                                        ) ?? new Date()
                                                    )}
                                                </span>
                                                <span className="text-muted-foreground mt-1 block text-left text-sm">
                                                    {dayShowtimes.length}{" "}
                                                    showings
                                                    · from{" "}
                                                    {priceFormatter.format(
                                                        firstPrice
                                                    )}
                                                </span>
                                            </Link>
                                        </Button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                No showtimes available yet.
                            </p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </section>
    );
}
