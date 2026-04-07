"use client";

// Shows the movie, seats, and totals during checkout.
import Image from "next/image";
import {
    Armchair,
    Clock3,
    Film,
    MapPin,
    Smartphone,
    Sparkles,
    Ticket,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";

interface CheckoutBookingSummaryProps {
    movieTitle: string;
    showtimeLabel: string;
    posterUrl: string | null;
    seatLabels: string[];
    ticketCount: number;
    total: string;
}

export function CheckoutBookingSummary({
    movieTitle,
    showtimeLabel,
    posterUrl,
    seatLabels,
    ticketCount,
    total,
}: CheckoutBookingSummaryProps) {
    const hasSeats = seatLabels.length > 0;
    const seatSummary = hasSeats ? seatLabels.join(" • ") : "Seats pending";
    const checkoutPerks = [
        {
            label: "Entry ready",
            value: "Mobile ticket accepted",
            icon: Smartphone,
        },
        {
            label: "Seat hold",
            value: "Reserved during checkout",
            icon: Armchair,
        },
        {
            label: "Arrival",
            value: "Best 10-15 min early",
            icon: Clock3,
        },
    ];

    return (
        <Card className="glass-panel relative h-full overflow-hidden rounded-3xl border border-[#2b74c6]/45 bg-[#07192f]/58 py-0 shadow-xl shadow-slate-950/20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(89,220,255,0.14),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(255,182,98,0.12),transparent_22%)]" />
            <CardContent className="relative z-10 flex h-full flex-col gap-6 p-6 md:p-8">
                <div className="grid gap-6 lg:grid-cols-[132px_1fr]">
                    <div className="relative h-48 overflow-hidden rounded-2xl border border-white/12 bg-[#0b233f] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
                        <Image
                            src={posterUrl ?? "/posters/placeholder.png"}
                            alt={`${movieTitle} poster`}
                            fill
                            sizes="132px"
                            className="object-cover"
                        />
                    </div>
                    <div className="flex flex-col justify-between gap-5">
                        <div className="space-y-4">
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

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <span className="mb-3 inline-flex rounded-full border border-white/10 bg-[#102844] p-2">
                                    <Ticket className="size-4 text-sky-200" />
                                </span>
                                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
                                    Tickets
                                </p>
                                <p className="mt-2 text-lg font-semibold">
                                    {ticketCount}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <span className="mb-3 inline-flex rounded-full border border-white/10 bg-[#102844] p-2">
                                    <MapPin className="size-4 text-sky-200" />
                                </span>
                                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
                                    Seats
                                </p>
                                <p className="mt-2 text-sm font-semibold">
                                    {seatSummary}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <span className="mb-3 inline-flex rounded-full border border-white/10 bg-[#102844] p-2">
                                    <Film className="size-4 text-sky-200" />
                                </span>
                                <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
                                    Total
                                </p>
                                <p className="mt-2 text-lg font-semibold">
                                    {total}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid flex-1 gap-5">
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

                    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(8,27,48,0.94)_38%,rgba(84,212,255,0.08))] p-5">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,204,120,0.18),transparent_24%),radial-gradient(circle_at_88%_100%,rgba(91,214,255,0.16),transparent_28%)]" />
                        <div className="relative">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.28em] uppercase">
                                        Almost Showtime
                                    </p>
                                    <p className="mt-3 max-w-xl text-2xl font-semibold tracking-tight">
                                        Your night at the movies is nearly set.
                                    </p>
                                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/75">
                                        A few quick reminders before you finish
                                        payment.
                                    </p>
                                </div>
                                <span className="rounded-full border border-white/10 bg-white/8 p-3 shadow-[0_0_24px_rgba(91,214,255,0.12)]">
                                    <Sparkles className="size-5 text-sky-200" />
                                </span>
                            </div>

                            <div className="mt-5 grid gap-3 md:grid-cols-3">
                                {checkoutPerks.map(
                                    ({ label, value, icon: Icon }) => (
                                        <div
                                            key={label}
                                            className="rounded-2xl border border-white/8 bg-[#0b2340]/50 px-4 py-4 backdrop-blur-sm"
                                        >
                                            <span className="mb-3 inline-flex rounded-full border border-white/10 bg-white/6 p-2">
                                                <Icon className="size-4 text-sky-200" />
                                            </span>
                                            <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.2em] uppercase">
                                                {label}
                                            </p>
                                            <p className="mt-2 text-sm leading-6 font-semibold">
                                                {value}
                                            </p>
                                        </div>
                                    )
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
