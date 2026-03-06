"use client";

import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { CheckoutSummaryMetric } from "~/components/ui/checkout-summary-metric";

interface CheckoutBookingSummaryProps {
    movieTitle: string;
    showtimeLabel: string;
    posterUrl: string | null;
    seatLabels: string[];
    ticketCount: number;
    priceEach: string;
}

export function CheckoutBookingSummary({
    movieTitle,
    showtimeLabel,
    posterUrl,
    seatLabels,
    ticketCount,
    priceEach,
}: CheckoutBookingSummaryProps) {
    const hasSeats = seatLabels.length > 0;

    return (
        <Card className="glass-panel relative overflow-hidden rounded-3xl border border-[#2b74c6]/45 bg-[#07192f]/58 py-0 shadow-xl shadow-slate-950/20">
            <CardContent className="relative z-10 space-y-7 p-6 md:p-8">
                <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
                    <div className="relative h-44 w-30 overflow-hidden rounded-xl border border-white/12 bg-[#0b233f]">
                        <Image
                            src={posterUrl ?? "/posters/placeholder.png"}
                            alt={`${movieTitle} poster`}
                            fill
                            sizes="120px"
                            className="object-cover"
                        />
                    </div>
                    <div className="space-y-3">
                        <div>
                            <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">
                                Movie
                            </p>
                            <p className="mt-2 text-2xl leading-tight font-semibold md:text-3xl">
                                {movieTitle}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">
                                Showtime
                            </p>
                            <p className="mt-1 text-xl font-medium md:text-2xl">
                                {showtimeLabel}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="border-border/70 border-t pt-6">
                    <p className="text-muted-foreground mb-3 text-xs font-semibold tracking-[0.25em] uppercase">
                        Seats
                    </p>
                    {hasSeats ? (
                        <div className="flex flex-wrap gap-2">
                            {seatLabels.map((seatLabel) => (
                                <Badge
                                    key={seatLabel}
                                    variant="outline"
                                    className="rounded-md border-white/12 bg-[#102844] px-3 py-1 text-sm"
                                >
                                    {seatLabel}
                                </Badge>
                            ))}
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            No seats selected.
                        </p>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <CheckoutSummaryMetric
                        label="Tickets"
                        value={`${ticketCount} total`}
                    />
                    <CheckoutSummaryMetric
                        label="Price Each"
                        value={priceEach}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
