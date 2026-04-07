"use client";

import { notFound } from "next/navigation";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import {
    formatList,
    formatShowtimeDate,
    formatShowtimeTime,
} from "~/lib/utils";
import { $Enums } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { useState } from "react";
import { toast } from "sonner";
import { Separator } from "~/components/ui/separator";
import { Card, CardContent } from "~/components/ui/card";
import { BackButton } from "~/components/ui/back-button";
import { MovieDetail } from "~/components/ui/movieDetail";
import SeatMap from "./seatMapComponents/seatMap";
import { Button } from "@react-email/components";

interface SeatSelectionPageProps {
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
        watchPartyId?: string | null;
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

export default function SeatSelectionPage({
    bookingSession,
    handleUpdateSession,
}: SeatSelectionPageProps) {
    const router = useRouter();
    const {
        data: seatInfo,
        isLoading,
        isFetching,
    } = api.showtimeSeats.getByShowtime.useQuery({
        showtimeId: bookingSession.showtimeId,
    });

    if (!isLoading && (!seatInfo || seatInfo === undefined)) {
        notFound();
    }

    const movieTitle = bookingSession.showtime.movie.title;
    const moviePosterUrl = bookingSession.showtime.movie.posterUrl || "";
    const movieLanguages = formatList(bookingSession.showtime.movie?.languages);
    const showtimeDate = bookingSession.showtime.startTime;
    const selectedTickets = bookingSession.ticketCount;
    const showtimeId = bookingSession.showtime.id;
    const watchPartyId = bookingSession.watchPartyId;

    const [selectedSeats, setSelectedSeats] = useState<Map<string, string>>(
        new Map()
    );

    const getSelectedSeatNumbers = () => {
        return Array.from(selectedSeats.values());
    };

    const selectedSeatSummary = getSelectedSeatNumbers().join(", ") || "None";
    const seatsRemaining = Math.max(
        (selectedTickets ?? 0) - selectedSeats.size,
        0
    );

    return (
        <>
            {isLoading ? (
                <p>Loading seat map layout...</p>
            ) : (
                <section className="full-bleed relative -mt-24 min-h-screen overflow-hidden">
                    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 pt-25 pb-20">
                        <div className="mb-8">
                            {watchPartyId ? (
                                <BackButton
                                    href={`/watch-party/${watchPartyId}`}
                                >
                                    Back to party
                                </BackButton>
                            ) : (
                                <BackButton
                                    onClick={() => {
                                        void handleUpdateSession(
                                            bookingSession.id,
                                            $Enums.BookingStep.TICKET_QUANTITY,
                                            bookingSession.ticketCount ??
                                                undefined,
                                            undefined
                                        ).catch((error) => {
                                            const message =
                                                error instanceof Error
                                                    ? error.message
                                                    : "Unable to go back to ticket selection.";
                                            toast.error(message);
                                            router.replace("/ticketing");
                                            router.refresh();
                                        });
                                    }}
                                >
                                    Back to ticket selection
                                </BackButton>
                            )}
                        </div>

                        <div className="grid gap-10 lg:grid-cols-[550px_1fr]">
                            <MovieDetail
                                props={{
                                    posterUrl: moviePosterUrl,
                                    title: movieTitle,
                                    languages: movieLanguages,
                                    showTime: `${formatShowtimeDate(showtimeDate) || ""} | ${formatShowtimeTime(showtimeDate) || ""}`,
                                }}
                            />
                        </div>
                        <div className="mt-10 flex flex-col items-stretch">
                            <Card className="glass-panel w-full rounded-[30px] border border-white/10">
                                <CardContent className="space-y-6 p-6 sm:p-8">
                                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                        <div className="space-y-3">
                                            <p className="text-xs font-semibold tracking-[0.4em] text-slate-200/65 uppercase">
                                                Seat Selection
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-2xl font-semibold text-white">
                                                    Selected Seats
                                                </h3>
                                                <span className="rounded-full border border-amber-200/20 bg-amber-200/10 px-3 py-1 text-xs font-semibold tracking-[0.25em] text-amber-50/85 uppercase">
                                                    {selectedSeats.size}/
                                                    {selectedTickets ?? 0}{" "}
                                                    chosen
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
                                                Review the auditorium layout and
                                                choose any available seats
                                                before you continue to payment.
                                            </p>
                                        </div>
                                        <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))] px-5 py-4 lg:min-w-[300px]">
                                            <p className="text-xs font-semibold tracking-[0.32em] text-slate-200/60 uppercase">
                                                Current Selection
                                            </p>
                                            <p className="mt-3 text-lg font-semibold tracking-[0.22em] text-white uppercase sm:text-xl">
                                                {selectedSeatSummary}
                                            </p>
                                            <p className="text-muted-foreground mt-3 text-sm">
                                                {seatsRemaining === 0
                                                    ? "Seat count matched. You can continue when ready."
                                                    : `Choose ${seatsRemaining} more seat${seatsRemaining === 1 ? "" : "s"} to match your ticket count.`}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="seat-map-container mt-10">
                            <div className="glass-panel rounded-[34px] border border-white/10 p-4 sm:p-6">
                                <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold tracking-[0.42em] text-slate-200/65 uppercase">
                                            Theatre Layout
                                        </p>
                                        <h2 className="mt-3 text-2xl font-semibold text-white">
                                            Choose your seats
                                        </h2>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5">
                                            <span className="relative block h-5 w-6">
                                                <span className="absolute inset-x-1 top-0 h-2 rounded-t-md bg-[#90b4ff]"></span>
                                                <span className="absolute inset-x-0 top-2 h-2.5 rounded-md bg-[#2f5fcb]"></span>
                                            </span>
                                            <span className="text-xs font-semibold tracking-[0.22em] text-slate-100/80 uppercase">
                                                Available
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5">
                                            <span className="relative block h-5 w-6">
                                                <span className="absolute inset-x-1 top-0 h-2 rounded-t-md bg-[#8a909a]"></span>
                                                <span className="absolute inset-x-0 top-2 h-2.5 rounded-md bg-[#5f6671]"></span>
                                            </span>
                                            <span className="text-xs font-semibold tracking-[0.22em] text-slate-100/80 uppercase">
                                                Occupied
                                            </span>
                                        </div>
                                        <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5">
                                            <span className="relative block h-5 w-6">
                                                <span className="absolute inset-x-1 top-0 h-2 rounded-t-md bg-[#f3d88d]"></span>
                                                <span className="absolute inset-x-0 top-2 h-2.5 rounded-md bg-[#b36f18]"></span>
                                            </span>
                                            <span className="text-xs font-semibold tracking-[0.22em] text-slate-100/80 uppercase">
                                                Selected
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <SeatMap
                                    key={`${bookingSession.id}:${bookingSession.ticketCount ?? 0}`}
                                    props={{
                                        selectedSeats: selectedSeats,
                                        setSelectedSeats: setSelectedSeats,
                                        selectedTicketCount:
                                            bookingSession.ticketCount || 1,
                                        totalSeatRows: 7,
                                        seatPerRow: 15,
                                        seatInfo: seatInfo,
                                        seatInfoReady:
                                            !isLoading && !isFetching,
                                    }}
                                />
                            </div>

                            <Separator className="bg-border/70 mt-10" />

                            <div className="mt-20 flex flex-row items-stretch justify-center">
                                <Button
                                    key={showtimeId}
                                    onClick={(e) => {
                                        if (
                                            selectedSeats.size === 0 ||
                                            selectedSeats.size !==
                                                selectedTickets
                                        ) {
                                            e.preventDefault();
                                        } else {
                                            handleUpdateSession(
                                                bookingSession.id,
                                                $Enums.BookingStep.CHECKOUT,
                                                bookingSession.ticketCount ||
                                                    undefined,
                                                Array.from(selectedSeats.keys())
                                            );
                                        }
                                    }}
                                    className={
                                        "focus-visible:ring-ring ring-offset-background bg-primary text-background text-m relative inline-flex h-10 w-full max-w-150 items-center justify-center overflow-hidden rounded-md px-4 py-2 text-center font-medium whitespace-nowrap shadow transition-colors before:absolute before:inset-0 before:z-0 before:opacity-50 before:[background:linear-gradient(-75deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.4)_50%,hsl(var(--primary))_100%)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" +
                                        (selectedSeats.size === 0 ||
                                        selectedSeats.size !== selectedTickets
                                            ? " cursor-not-allowed opacity-50 not-first:pointer-events-none"
                                            : " hover:opacity-80")
                                    }
                                >
                                    Proceed to Payment
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
