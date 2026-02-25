"use client";

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useState, useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { formatShowtimeDateLabel, formatShowtimeTimeLabel } from "~/lib/utils";
import { api } from "~/trpc/react";

interface ShowtimesPageProps {
    params: Promise<{ movieId: string }>;
}

interface Showtime {
    id: string;
    startTime: Date;
    price?: number;
}

function groupShowtimesByDate(showtimes: Showtime[]): Map<string, Showtime[]> {
    return showtimes.reduce((map, showtime) => {
        const key = formatShowtimeDateLabel(showtime.startTime);
        map.set(key, [...(map.get(key) ?? []), showtime]);
        return map;
    }, new Map<string, Showtime[]>());
}

function MoviePoster({
    title,
    posterUrl,
}: {
    title: string;
    posterUrl?: string | null;
}) {
    return (
        <div className="space-y-4 lg:pt-10">
            <h1 className="text-2xl font-bold">{title}</h1>
            <div className="relative aspect-2/3 overflow-hidden rounded-2xl border border-white/10">
                <Image
                    src={posterUrl ?? "/posters/placeholder.png"}
                    alt={`${title} poster`}
                    fill
                    className="object-cover"
                    sizes="320px"
                />
            </div>
        </div>
    );
}

function DateList({
    availableDates,
    showtimesByDate,
    effectiveDate,
    onSelectDate,
}: {
    availableDates: string[];
    showtimesByDate: Map<string, Showtime[]>;
    effectiveDate: string | null;
    onSelectDate: (date: string) => void;
}) {
    return (
        <div className="min-w-0 space-y-3 lg:pt-3">
            <p className="text-foreground text-sm font-bold tracking-[0.2em] uppercase">
                Dates
            </p>
            <div className="grid gap-3">
                {availableDates.map((dateKey) => {
                    const dayShowtimes = showtimesByDate.get(dateKey) ?? [];

                    return (
                        <Button
                            key={dateKey}
                            variant={
                                dateKey === effectiveDate
                                    ? "default"
                                    : "outline"
                            }
                            className="h-auto w-full justify-start py-4 whitespace-normal"
                            onClick={() => onSelectDate(dateKey)}
                        >
                            <span className="block w-full min-w-0">
                                <span className="block text-left text-base font-semibold">
                                    {formatShowtimeDateLabel(dateKey)}
                                </span>
                                <span className="text-muted-foreground mt-1 block text-left text-sm">
                                    {dayShowtimes.length} showings
                                </span>
                            </span>
                        </Button>
                    );
                })}
            </div>
        </div>
    );
}

function ShowtimePicker({
    showtimes,
    selectedShowtimeId,
    onSelect,
}: {
    showtimes: Showtime[];
    selectedShowtimeId: string | null;
    onSelect: (id: string) => void;
}) {
    return (
        <div className="min-w-0 space-y-5 lg:pt-10">
            <h2 className="text-2xl font-semibold md:text-3xl">
                Choose a showtime
            </h2>

            {showtimes.length > 0 ? (
                <>
                    <div className="flex flex-wrap gap-3">
                        {showtimes.map((showtime) => (
                            <Button
                                key={showtime.id}
                                variant={
                                    showtime.id === selectedShowtimeId
                                        ? "default"
                                        : "outline"
                                }
                                size="lg"
                                className="min-w-28"
                                onClick={() => onSelect(showtime.id)}
                            >
                                {formatShowtimeTimeLabel(showtime.startTime)}
                            </Button>
                        ))}
                    </div>
                </>
            ) : (
                <p className="text-muted-foreground text-sm">
                    No upcoming showtimes are available yet.
                </p>
            )}
        </div>
    );
}

export default function MovieShowtimesPage({ params }: ShowtimesPageProps) {
    const { movieId } = use(params);

    const { data: payload, isLoading } = api.showtimes.getByMovie.useQuery(
        { movieId },
        { staleTime: 60_000 }
    );

    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedShowtimeId, setSelectedShowtimeId] = useState<string | null>(
        null
    );

    const showtimesByDate = useMemo(() => {
        const showtimes = payload?.showtimes ?? [];
        return groupShowtimesByDate(showtimes);
    }, [payload?.showtimes]);
    const availableDates = Array.from(showtimesByDate.keys());
    const effectiveDate = selectedDate ?? availableDates[0] ?? null;
    const selectedDayShowtimes = effectiveDate
        ? (showtimesByDate.get(effectiveDate) ?? [])
        : [];

    if (!isLoading && !payload) notFound();

    function handleSelectDate(date: string) {
        setSelectedDate(date);
        setSelectedShowtimeId(null);
    }

    return (
        <section className="mx-auto w-full max-w-7xl px-6">
            <div className="mb-8">
                <Link
                    href={`/movies/${movieId}`}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm transition"
                >
                    <span aria-hidden="true">←</span>
                    Back to details
                </Link>
            </div>

            <Card className="glass-panel overflow-hidden rounded-3xl border">
                <CardContent className="grid gap-8 p-6 lg:grid-cols-[320px_1fr_300px] lg:p-8">
                    {payload?.movie && <MoviePoster {...payload.movie} />}

                    {isLoading ? (
                        <p className="text-muted-foreground text-sm">
                            Loading showtimes…
                        </p>
                    ) : (
                        <ShowtimePicker
                            showtimes={selectedDayShowtimes}
                            selectedShowtimeId={selectedShowtimeId}
                            onSelect={setSelectedShowtimeId}
                        />
                    )}

                    {isLoading ? (
                        <></>
                    ) : availableDates.length > 0 ? (
                        <DateList
                            availableDates={availableDates}
                            showtimesByDate={showtimesByDate}
                            effectiveDate={effectiveDate}
                            onSelectDate={handleSelectDate}
                        />
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            No upcoming showtimes available yet.
                        </p>
                    )}
                </CardContent>
            </Card>
        </section>
    );
}
