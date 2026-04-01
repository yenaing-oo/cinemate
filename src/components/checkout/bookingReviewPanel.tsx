"use client";

import { useState } from "react";
import { CheckoutBookingSummary } from "~/components/checkout/checkoutBookingSummary";
import { CheckoutPaymentSection } from "~/components/checkout/checkoutPaymentSection";
import type { ConfirmablePaymentDetails } from "~/components/checkout/paymentDetails";

interface BookingReviewPanelProps {
    movieTitle: string;
    showtimeLabel: string;
    posterUrl: string | null;
    seatLabels: string[];
    ticketCount: number;
    priceEach: string;
    total: string;
    isSubmitting: boolean;
    backButton?: React.ReactNode;
    onConfirm: (paymentDetails: ConfirmablePaymentDetails) => Promise<void>;
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
    backButton,
    onConfirm,
}: BookingReviewPanelProps) {
    const hasSeats = seatLabels.length > 0;
    const [paymentDetails, setPaymentDetails] =
        useState<ConfirmablePaymentDetails | null>(null);

    return (
        <section className="full-bleed relative -mt-24 min-h-screen overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_14%,rgba(52,186,255,0.25),transparent_34%),radial-gradient(circle_at_86%_12%,rgba(255,172,79,0.18),transparent_30%),#031023]" />

            <div className="relative mx-auto w-full max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
                <div className="mb-8 space-y-4 pl-1 sm:pl-2">
                    {backButton}

                    <div className="space-y-2">
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
                </div>

                <div className="relative z-10 grid gap-6 lg:grid-cols-[1.9fr_1fr]">
                    <CheckoutBookingSummary
                        movieTitle={movieTitle}
                        showtimeLabel={showtimeLabel}
                        posterUrl={posterUrl}
                        seatLabels={seatLabels}
                        ticketCount={ticketCount}
                        total={total}
                    />
                    <CheckoutPaymentSection
                        ticketCount={ticketCount}
                        priceEach={priceEach}
                        total={total}
                        isSubmitting={isSubmitting}
                        hasSeats={hasSeats}
                        paymentDetails={paymentDetails}
                        onPaymentDetailsChange={setPaymentDetails}
                        onConfirm={onConfirm}
                    />
                </div>
            </div>
        </section>
    );
}
