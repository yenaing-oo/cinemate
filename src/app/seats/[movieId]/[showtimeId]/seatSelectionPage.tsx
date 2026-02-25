"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";
import { MovieDetail } from "~/components/ui/movieDetail";
import SeatMap from "./seatMapComponents/seatMap";
import Link from "next/link";
import type { $Enums } from "@prisma/client";

interface SeatSelectionProps {
    props: {
        posterUrl: string;
        title: string;
        languages: string[];
        movieId: string;
        showtimeId: string;
        seatInfo: {
            seatId: string;
            row: number;
            number: number;
            status: $Enums.SeatStatus;
        }[];
    };
}

export default function SeatSelection({ props }: SeatSelectionProps) {
    const [selectedSeats, setSelectedSeats] = useState<Map<string, string>>(
        new Map()
    );

    const getSelectedSeatNumbers = () => {
        return Array.from(selectedSeats.values());
    };

    return (
        <section className="full-bleed relative -mt-24 min-h-screen overflow-hidden">
            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-6 pt-25 pb-20">
                <div className="grid gap-10 lg:grid-cols-[550px_1fr]">
                    <MovieDetail
                        props={{
                            posterUrl: props.posterUrl,
                            title: props.title,
                            languages: props.languages,
                            showTime: "7:00 PM",
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
                                    {getSelectedSeatNumbers().join(", ") ||
                                        "None"}
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
                            selectedTicketCount: 5,
                            totalSeatRows: 7,
                            seatPerRow: 15,
                            seatInfo: props.seatInfo,
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
                        <Link
                            key={props.showtimeId}
                            href={`#`}
                            role="button"
                            className={
                                "focus-visible:ring-ring ring-offset-background bg-primary text-background text-m relative inline-flex h-10 w-full max-w-150 items-center justify-center overflow-hidden rounded-md px-4 py-2 font-medium whitespace-nowrap shadow transition-colors before:absolute before:inset-0 before:z-0 before:opacity-50 before:[background:linear-gradient(-75deg,hsl(var(--primary))_0%,hsl(var(--primary)/0.4)_50%,hsl(var(--primary))_100%)] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
                                // (ticketCount === 0
                                //     ? " cursor-not-allowed opacity-50 not-first:pointer-events-none"
                                //     : " hover:opacity-80")
                            }
                        >
                            Review Booking
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
