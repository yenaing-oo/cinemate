"use client";

import { useState } from "react";
import { Card, CardContent } from "~/components/ui/card";
import { MovieDetail } from "~/components/ui/movieDetail";
import SeatMap from "./seatMapComponents/seatMap";

interface SeatSelectionProps {
    props: {
        posterUrl: string;
        title: string;
        languages: string[];
        movieId: string;
        showtimeId: string;
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
                        }}
                    />
                </div>
            </div>
        </section>
    );
}
