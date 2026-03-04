"use client";

import Image from "next/image";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { CheckoutSummaryMetric } from "~/components/ui/checkoutSummaryCard";

interface BookingReviewPanelProps {
    movieTitle: string;
    showtimeLabel: string;
    posterUrl: string | null;
    seatLabels: string[];
    ticketCount: number;
    priceEach: string;
    total: string;
    isSubmitting: boolean;
    onConfirm: () => Promise<void>;
}

export function BookingReviewPanel({
    movieTitle,
    showtimeLabel,
    posterUrl,
    seatLabels,
    ticketCount,
    priceEach,
    total,
    isSubmitting,
    onConfirm,
}: BookingReviewPanelProps) {
    const hasSeats = seatLabels.length > 0;

    return (
        <section className="full-bleed relative -mt-24 min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(52,186,255,0.25),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(255,172,79,0.18),transparent_30%),#031023]" />

            <div className="relative mx-auto w-full max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
                <div className="mb-8 space-y-2 pl-1 sm:pl-2">
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.33em] uppercase">
                        Checkout
                    </p>
                    <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                        Review your booking
                    </h2>
                    <p className="text-muted-foreground text-lg">
                        Here is a summary of your selected seats before you
                        confirm.
                    </p>
                </div>

                <div className="relative z-10 grid gap-6 lg:grid-cols-[1.9fr_1fr]">
                    <Card className="glass-panel relative overflow-hidden rounded-3xl border border-[#2b74c6]/45 bg-[#07192f]/58 py-0 shadow-xl shadow-slate-950/20">
                        <CardContent className="relative z-10 space-y-7 p-6 md:p-8">
                            <div className="grid gap-5 sm:grid-cols-[120px_1fr]">
                                <div className="relative h-44 w-30 overflow-hidden rounded-xl border border-white/12 bg-[#0b233f]">
                                    <Image
                                        src={
                                            posterUrl ??
                                            "/posters/placeholder.png"
                                        }
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

                    <Card className="glass-panel relative overflow-hidden rounded-3xl border border-[#2b74c6]/52 bg-[#0a1e39]/62 py-0 shadow-xl shadow-slate-950/20 before:pointer-events-none before:absolute before:top-0 before:right-8 before:left-8 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#ffd58a]/85 before:to-transparent">
                        <CardContent className="relative z-10 space-y-6 p-6">
                            <div>
                                <p className="text-muted-foreground text-xs font-semibold tracking-[0.25em] uppercase">
                                    Total
                                </p>
                                <p className="mt-2 text-[1.85rem] font-bold tracking-tight md:text-[2.05rem]">
                                    {total}
                                </p>
                            </div>

                            <div className="glass-card space-y-3 rounded-2xl border border-white/10 p-4 text-sm">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Tickets
                                    </span>
                                    <span className="font-semibold">
                                        {ticketCount}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">
                                        Price each
                                    </span>
                                    <span className="font-semibold">
                                        {priceEach}
                                    </span>
                                </div>
                            </div>

                            <p className="text-muted-foreground text-sm">
                                No payment details required yet.
                            </p>

                            <div className="space-y-3">
                                <Button
                                    className="relative w-full overflow-hidden rounded-xl border border-[#78dfff]/30 bg-gradient-to-r from-[#54d4ff] via-[#3cb8ff] to-[#66a4ff] text-[#04111f] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_12px_24px_rgba(47,157,255,0.25)] before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:skew-x-[-25deg] before:bg-gradient-to-r before:from-transparent before:via-white/45 before:to-transparent hover:shadow-[0_0_0_1px_rgba(255,255,255,0.28)_inset,0_16px_30px_rgba(58,177,255,0.32)]"
                                    disabled={!hasSeats || isSubmitting}
                                    onClick={() => {
                                        void onConfirm();
                                    }}
                                >
                                    {isSubmitting
                                        ? "Confirming reservation..."
                                        : "Confirm reservation"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    );
}
