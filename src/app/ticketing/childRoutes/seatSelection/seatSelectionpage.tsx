"use client";

import { notFound } from "next/navigation";
import { api } from "~/trpc/react";
import {
    formatList,
    formatShowtimeDate,
    formatShowtimeTime,
} from "~/lib/utils";
import { $Enums } from "@prisma/client";
import type { Decimal } from "@prisma/client/runtime/library";
import { useState } from "react";
import { Separator } from "~/components/ui/separator";
import { Card, CardContent } from "~/components/ui/card";
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
    const { data: seatInfo, isLoading } =
        api.showtimeSeats.getByShowtime.useQuery({
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

    const [selectedSeats, setSelectedSeats] = useState<Map<string, string>>(
        new Map()
    );

    const getSelectedSeatNumbers = () => {
        return Array.from(selectedSeats.values());
    };

    return (
        <>
            {isLoading ? (
                <p>Loading seat map layout...</p>
            ) : (
                <section className="full-bleed relative -mt-24 min-h-screen overflow-hidden">
                    <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 pt-25 pb-20">
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
                            <Card className="glass-panel w-full rounded-2xl">
                                <CardContent className="space-y-6 p-6">
                                    <div className="grid items-center gap-x-10 gap-y-3 lg:grid-cols-[auto_1fr]">
                                        <h3 className="text-xl font-semibold tracking-[0.15em] text-green-500 uppercase">
                                            Selected Seat:
                                        </h3>
                                        <p className="text-muted-foreground/90 text-s font-semibold tracking-[0.25em] uppercase">
                                            {getSelectedSeatNumbers().join(
                                                ", "
                                            ) || "None"}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="seat-map-container mt-10">
                            <SeatMap
                                props={{
                                    selectedSeats: selectedSeats,
                                    setSelectedSeats: setSelectedSeats,
                                    selectedTicketCount:
                                        bookingSession.ticketCount || 1,
                                    totalSeatRows: 7,
                                    seatPerRow: 15,
                                    seatInfo: seatInfo,
                                }}
                            />
                            <div className="flex flex-wrap items-center justify-start gap-x-10 gap-y-3 overflow-hidden pt-5 sm:justify-evenly">
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-sm bg-[#3662e3]"></div>
                                    <p className="text-muted-foreground/90 text-s ml-5 font-semibold tracking-[0.25em] uppercase">
                                        Available
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-sm bg-[#565656]"></div>
                                    <p className="text-muted-foreground/90 text-s ml-5 font-semibold tracking-[0.25em] uppercase">
                                        Occupied
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <div className="h-8 w-8 rounded-sm bg-[#4CAF50]"></div>
                                    <p className="text-muted-foreground/90 text-s ml-5 font-semibold tracking-[0.25em] uppercase">
                                        Selected
                                    </p>
                                </div>
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
