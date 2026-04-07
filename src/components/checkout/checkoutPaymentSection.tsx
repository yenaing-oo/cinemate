"use client";

// Handles saved-card display and new-card entry during checkout.
import { useEffect, useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { PaymentDetailsForm } from "~/components/checkout/paymentDetailsForm";
import type { ConfirmablePaymentDetails } from "~/components/checkout/paymentDetails";
import { api } from "~/trpc/react";

interface CheckoutPaymentSectionProps {
    ticketCount: number;
    priceEach: string;
    total: string;
    isSubmitting: boolean;
    hasSeats: boolean;
    paymentDetails: ConfirmablePaymentDetails | null;
    onPaymentDetailsChange: (details: ConfirmablePaymentDetails | null) => void;
    onConfirm: (paymentDetails: ConfirmablePaymentDetails) => Promise<void>;
}

export function CheckoutPaymentSection({
    ticketCount,
    priceEach,
    total,
    isSubmitting,
    hasSeats,
    paymentDetails,
    onPaymentDetailsChange,
    onConfirm,
}: CheckoutPaymentSectionProps) {
    const { data: savedPayment } = api.paymentMethod.getSaved.useQuery();
    const [paymentOption, setPaymentOption] = useState<"saved" | "new">(
        "saved"
    );
    const hasSavedCard =
        savedPayment?.hasSavedCard === true &&
        typeof savedPayment.cardLast4 === "string";
    const useSavedCard = hasSavedCard && paymentOption === "saved";

    useEffect(() => {
        if (!savedPayment?.hasSavedCard || !savedPayment.cardLast4) {
            if (useSavedCard) {
                onPaymentDetailsChange(null);
            }
            return;
        }

        if (!useSavedCard) {
            onPaymentDetailsChange(null);
            return;
        }

        onPaymentDetailsChange({
            source: "saved",
            cardLast4: savedPayment.cardLast4,
            cardBrand: savedPayment.cardBrand ?? "Card",
        });
    }, [
        onPaymentDetailsChange,
        savedPayment?.cardBrand,
        savedPayment?.cardLast4,
        savedPayment?.hasSavedCard,
        useSavedCard,
    ]);

    return (
        <Card className="glass-panel relative overflow-hidden rounded-3xl border border-[#2b74c6]/52 bg-[#0a1e39]/62 py-0 shadow-xl shadow-slate-950/20 before:pointer-events-none before:absolute before:top-0 before:right-8 before:left-8 before:h-px before:bg-linear-to-r before:from-transparent before:via-[#ffd58a]/85 before:to-transparent">
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
                        <span className="text-muted-foreground">Tickets</span>
                        <span className="font-semibold">{ticketCount}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                            Price each
                        </span>
                        <span className="font-semibold">{priceEach}</span>
                    </div>
                </div>

                {hasSavedCard ? (
                    <div className="space-y-3">
                        <p className="text-muted-foreground text-sm">
                            Use your saved card or provide a different card for
                            this booking.
                        </p>

                        <div className="glass-card space-y-3 rounded-2xl border border-white/10 p-4 text-sm">
                            <button
                                type="button"
                                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                                    useSavedCard
                                        ? "border-sky-300/60 bg-sky-300/12"
                                        : "border-white/15 bg-white/5"
                                }`}
                                onClick={() => setPaymentOption("saved")}
                            >
                                <p className="font-semibold text-slate-100">
                                    {savedPayment.cardBrand ?? "Card"} ending in{" "}
                                    {savedPayment.cardLast4}
                                </p>
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Saved for faster checkout.
                                </p>
                            </button>
                            <button
                                type="button"
                                className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                                    !useSavedCard
                                        ? "border-sky-300/60 bg-sky-300/12"
                                        : "border-white/15 bg-white/5"
                                }`}
                                onClick={() => setPaymentOption("new")}
                            >
                                <p className="font-semibold text-slate-100">
                                    Use a different card
                                </p>
                            </button>
                        </div>

                        {!useSavedCard ? (
                            <PaymentDetailsForm
                                onValidPaymentChange={onPaymentDetailsChange}
                            />
                        ) : null}
                    </div>
                ) : (
                    <div className="space-y-2">
                        <p className="text-muted-foreground text-sm">
                            Enter payment details to complete your booking.
                        </p>
                        <PaymentDetailsForm
                            onValidPaymentChange={onPaymentDetailsChange}
                        />
                    </div>
                )}

                <div className="space-y-3">
                    <Button
                        className="relative w-full overflow-hidden rounded-xl border border-[#78dfff]/30 bg-linear-to-r from-[#54d4ff] via-[#3cb8ff] to-[#66a4ff] text-[#04111f] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_12px_24px_rgba(47,157,255,0.25)] before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:skew-x-[-25deg] before:bg-linear-to-r before:from-transparent before:via-white/45 before:to-transparent hover:shadow-[0_0_0_1px_rgba(255,255,255,0.28)_inset,0_16px_30px_rgba(58,177,255,0.32)]"
                        disabled={
                            !hasSeats || isSubmitting || paymentDetails === null
                        }
                        onClick={() => {
                            if (!paymentDetails) return;
                            void onConfirm(paymentDetails);
                        }}
                    >
                        {isSubmitting
                            ? "Confirming reservation..."
                            : "Confirm reservation"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
