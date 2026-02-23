"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "~/components/ui/card";
import { MinusCircledIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { MovieDetail } from "~/components/ui/movieDetail";
import { useState } from "react";

interface TicketSelectionProps {
    props: {
        backdropUrl: string;
        posterUrl: string;
        title: string;
        languages: string[];
        movieId: string;
        showtimeId: string;
    };
}

export default function TicketSelection({ props }: TicketSelectionProps) {
    const [ticketCount, setTicketCount] = useState(0);
    const isMax = ticketCount >= 10;
    const isMin = ticketCount <= 0;
    const seatPrice = 15;

    return (
        <section className="full-bleed relative -mt-24 min-h-screen overflow-hidden">
            <div className="absolute inset-0">
                {props.backdropUrl || props.posterUrl ? (
                    <Image
                        src={props.backdropUrl || props.posterUrl}
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
            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 pt-25 pb-20">
                <div className="grid gap-10 lg:grid-cols-[550px_1fr]">
                    <MovieDetail
                        props={{
                            posterUrl: props.posterUrl,
                            title: props.title,
                            languages: props.languages,
                            showTime: "Mon Feb 16, 2026 | 8:00 PM",
                        }}
                    />
                    <div>
                        <div className="flex justify-center">
                            <Card className="glass-panel w-full max-w-200 rounded-2xl">
                                <CardContent className="space-y-6 p-6">
                                    <div>
                                        <h3 className="mb-5 text-xl font-bold">
                                            Order Summary
                                        </h3>
                                        <div className="mb-8 flex flex-row justify-between">
                                            <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
                                                Tickets (Including Tax):
                                            </p>
                                            <p className="text-muted-foreground max-w-2xl text-base leading-relaxed">
                                                ${ticketCount * seatPrice}
                                            </p>
                                        </div>
                                        <div className="flex flex-row items-stretch justify-center">
                                            <Link
                                                key={props.showtimeId}
                                                href={`/seats/${props.movieId}/${props.showtimeId}`}
                                                onClick={(e) => {
                                                    if (ticketCount === 0) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                tabIndex={
                                                    ticketCount === 0 ? -1 : 0
                                                }
                                                role="button"
                                                className={
                                                    "focus-visible:ring-ring ring-offset-background bg-primary text-background text-m relative inline-flex h-10 w-full items-center justify-center overflow-hidden rounded-md px-4 py-2 font-medium whitespace-nowrap shadow transition-colors before:absolute before:inset-0 before:z-0 before:opacity-50 before:[background:linear-gradient(-75deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.4)_50%,hsl(var(--primary))_100%)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" +
                                                    (ticketCount === 0
                                                        ? " cursor-not-allowed opacity-50 not-first:pointer-events-none"
                                                        : " hover:opacity-80")
                                                }
                                                aria-disabled={
                                                    ticketCount === 0
                                                }
                                            >
                                                Select Seats
                                            </Link>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <div>
                        <div className="flex justify-center">
                            <Card className="glass-panel w-full max-w-200 rounded-2xl">
                                <CardContent className="space-y-6 p-6">
                                    <div>
                                        <h3 className="mb-5 text-xl font-bold">
                                            Tickets
                                        </h3>
                                        <div className="flex flex-row justify-between">
                                            <p className="text-muted-foreground max-w-2xl text-lg leading-relaxed">
                                                General
                                            </p>
                                            <div className="flex flex-row items-center justify-between gap-5">
                                                <MinusCircledIcon
                                                    className={
                                                        "text-muted-foreground size-5 " +
                                                        (isMin
                                                            ? "cursor-not-allowed opacity-50"
                                                            : "hover:cursor-pointer")
                                                    }
                                                    aria-disabled={isMin}
                                                    onClick={() => {
                                                        if (isMin) return;
                                                        setTicketCount(
                                                            ticketCount > 1
                                                                ? ticketCount -
                                                                      1
                                                                : 0
                                                        );
                                                    }}
                                                />
                                                <p className="text-muted-foreground max-w-2xl min-w-5 text-center text-lg leading-relaxed select-none">
                                                    {ticketCount}
                                                </p>
                                                <PlusCircledIcon
                                                    className={
                                                        "text-muted-foreground size-5 " +
                                                        (isMax
                                                            ? "cursor-not-allowed opacity-50"
                                                            : "hover:cursor-pointer")
                                                    }
                                                    aria-disabled={isMax}
                                                    onClick={() => {
                                                        if (isMax) return;
                                                        setTicketCount(
                                                            ticketCount < 10
                                                                ? ticketCount +
                                                                      1
                                                                : 10
                                                        );
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
