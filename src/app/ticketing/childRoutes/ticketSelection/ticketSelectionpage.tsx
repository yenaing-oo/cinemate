"use client";

import Image from "next/image";
import { BackButton } from "~/components/ui/back-button";
import {
    formatList,
    formatShowtimeDate,
    formatShowtimeTime,
} from "~/lib/utils";
import { MinusCircledIcon, PlusCircledIcon } from "@radix-ui/react-icons";
import { api } from "~/trpc/react";
import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { MovieDetail } from "~/components/ui/movieDetail";
import { Button } from "~/components/ui/button";
import { $Enums } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";

interface TicketSelectionPageProps {
    bookingSession: {
        showtime: {
            movie: {
                title: string;
                id: string;
                posterUrl: string | null;
                backdropUrl: string | null;
                languages: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            movieId: string;
            startTime: Date;
            endTime: Date;
            price: Decimal;
        };
        selectedSeats: ({
            seat: {
                number: number;
                id: string;
                row: number;
            };
        } & {
            id: string;
            showtimeId: string;
            updatedAt: Date;
            seatId: string;
            isBooked: boolean;
            heldByUserId: string | null;
            heldTill: Date | null;
            bookingSessionId: string | null;
        })[];
    } & {
        id: string;
        userId: string | null;
        showtimeId: string;
        ticketCount: number | null;
        step: $Enums.BookingStep;
        startedAt: Date;
        expiresAt: Date;
        lastUpdatedAt: Date;
    };
    handleUpdateSession: (
        sessionId: string,
        goToStep: $Enums.BookingStep,
        ticketCount: number | undefined,
        selectedShowtimeSeatIds: string[] | undefined
    ) => Promise<void>;
}

export default function TicketSelectionPage({
    bookingSession,
    handleUpdateSession,
}: TicketSelectionPageProps) {
    const movieTitle = bookingSession.showtime.movie.title;
    const movieId = bookingSession.showtime.movie.id;
    const moviePosterUrl = bookingSession.showtime.movie.posterUrl || "";
    const movieBackdropUrl = bookingSession.showtime.movie.backdropUrl || "";
    const movieLanguages = formatList(bookingSession.showtime.movie?.languages);
    const showtimeDate = bookingSession.showtime.startTime;
    const showtimeId = bookingSession.showtime.id;

    const [ticketCount, setTicketCount] = useState(
        bookingSession.ticketCount ?? 0
    );
    const MAX_TICKETS_LIMIT = 10;
    const SEAT_PRICE = bookingSession.showtime.price;

    const { data } = api.showtimes.getAvailableSeatCount.useQuery({
        showtimeId: showtimeId,
    });

    const totalAvailableSeats = data || 0;
    const subtotal = ticketCount * Number(SEAT_PRICE);
    const canContinue = ticketCount > 0;

    const currentMaxTicketLimit =
        totalAvailableSeats < MAX_TICKETS_LIMIT
            ? totalAvailableSeats
            : MAX_TICKETS_LIMIT;

    const isMax = ticketCount >= currentMaxTicketLimit;
    const isMin = ticketCount <= 0;

    return (
        <section className="full-bleed relative -mt-24 min-h-screen overflow-hidden">
            <div className="absolute inset-0">
                {movieBackdropUrl || moviePosterUrl ? (
                    <Image
                        src={movieBackdropUrl || moviePosterUrl}
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
                <div className="mb-8">
                    <BackButton href={`/movies/${movieId}/showtimes`}>
                        Back to showtimes
                    </BackButton>
                </div>

                <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.05fr)_420px]">
                    <div className="space-y-8">
                        <MovieDetail
                            props={{
                                posterUrl: moviePosterUrl,
                                title: movieTitle,
                                languages: movieLanguages,
                                showTime: `${formatShowtimeDate(showtimeDate) || ""} | ${formatShowtimeTime(showtimeDate) || ""}`,
                            }}
                        />

                        <Card className="glass-panel rounded-[28px] border-white/12 shadow-[0_24px_80px_rgba(2,8,23,0.45)]">
                            <CardContent className="p-0">
                                <div className="border-b border-white/8 px-5 py-3.5">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <p className="text-primary/80 text-xs font-semibold tracking-[0.3em] uppercase">
                                                Ticket Selection
                                            </p>
                                            <h2 className="mt-1.5 text-[1.8rem] font-semibold tracking-tight text-white">
                                                Choose your tickets
                                            </h2>
                                            <p className="text-muted-foreground mt-1 text-sm">
                                                Select how many seats you want before moving to the map.
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 md:min-w-40">
                                            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-center">
                                                <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                                                    Price
                                                </p>
                                                <p className="mt-1.5 text-lg font-semibold text-white">
                                                    ${Number(SEAT_PRICE)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="px-5 py-4">
                                    <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] px-5 py-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-white text-[1.7rem] font-semibold leading-none">
                                                    General Admission
                                                </p>
                                                <p className="text-muted-foreground mt-1 text-sm">
                                                    Up to {currentMaxTicketLimit} tickets can be selected for this showtime.
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 self-start md:self-auto">
                                                <button
                                                    type="button"
                                                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-white transition ${
                                                        isMin
                                                            ? "cursor-not-allowed border-white/10 bg-white/5 opacity-45"
                                                            : "border-white/15 bg-white/8 hover:border-white/30 hover:bg-white/14"
                                                    }`}
                                                    aria-label="Decrease ticket count"
                                                    disabled={isMin}
                                                    onClick={() => {
                                                        if (isMin) return;
                                                        setTicketCount(
                                                            ticketCount > 1
                                                                ? ticketCount -
                                                                      1
                                                                : 0
                                                        );
                                                    }}
                                                >
                                                    <MinusCircledIcon className="size-5" />
                                                </button>

                                                <div className="min-w-24 rounded-2xl border border-cyan-300/20 bg-cyan-400/8 px-4 py-2 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                                    <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                                                        Tickets
                                                    </p>
                                                    <p className="mt-1 text-[1.8rem] font-semibold text-white tabular-nums leading-none">
                                                        {ticketCount}
                                                    </p>
                                                </div>

                                                <button
                                                    type="button"
                                                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-white transition ${
                                                        isMax
                                                            ? "cursor-not-allowed border-white/10 bg-white/5 opacity-45"
                                                            : "border-cyan-300/25 bg-cyan-400/12 hover:border-cyan-200/50 hover:bg-cyan-300/18"
                                                    }`}
                                                    aria-label="Increase ticket count"
                                                    disabled={isMax}
                                                    onClick={() => {
                                                        if (isMax) return;
                                                        setTicketCount(
                                                            ticketCount <
                                                                currentMaxTicketLimit
                                                                ? ticketCount +
                                                                      1
                                                                : currentMaxTicketLimit
                                                        );
                                                    }}
                                                >
                                                    <PlusCircledIcon className="size-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="xl:sticky xl:top-28">
                        <Card className="glass-panel rounded-[28px] border-white/12 shadow-[0_24px_80px_rgba(2,8,23,0.5)]">
                            <CardContent className="p-8">
                                <div className="border-b border-white/8 pb-6">
                                    <p className="text-primary/80 text-xs font-semibold tracking-[0.3em] uppercase">
                                        Ticket Summary
                                    </p>
                                    <h3 className="mt-2 text-2xl font-semibold text-white">
                                        Your selection
                                    </h3>
                                    <p className="text-muted-foreground mt-2 text-sm leading-6">
                                        Check your ticket count, then continue to choose your seats.
                                    </p>
                                </div>

                                <div className="space-y-4 py-6">
                                    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                                        <div>
                                            <p className="text-muted-foreground text-sm">
                                                Ticket type
                                            </p>
                                            <p className="mt-1 font-medium text-white">
                                                General
                                            </p>
                                        </div>
                                        <p className="text-lg font-semibold text-white">
                                            {ticketCount}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-4">
                                        <div>
                                            <p className="text-muted-foreground text-sm">
                                                Price per ticket
                                            </p>
                                            <p className="mt-1 font-medium text-white">
                                                Includes tax
                                            </p>
                                        </div>
                                        <p className="text-lg font-semibold text-white">
                                            ${Number(SEAT_PRICE)}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-cyan-300/15 bg-[linear-gradient(180deg,rgba(32,201,255,0.12),rgba(255,255,255,0.03))] p-5">
                                    <div className="flex items-end justify-between gap-4">
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-[0.24em]">
                                                Total
                                            </p>
                                            <p className="mt-2 text-4xl font-semibold text-white tabular-nums">
                                                ${subtotal}
                                            </p>
                                        </div>
                                        <p className="text-muted-foreground text-sm text-right">
                                            {ticketCount === 1
                                                ? "1 ticket selected"
                                                : `${ticketCount} tickets selected`}
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    key={showtimeId}
                                    type="button"
                                    size="lg"
                                    disabled={!canContinue}
                                    onClick={() => {
                                        if (!canContinue) return;
                                        handleUpdateSession(
                                            bookingSession.id,
                                            $Enums.BookingStep.SEAT_SELECTION,
                                            ticketCount,
                                            undefined
                                        );
                                    }}
                                    className="mt-6 h-12 w-full rounded-xl text-base font-semibold"
                                >
                                    {canContinue
                                        ? "Continue to Seat Selection"
                                        : "Select at least one ticket"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}
