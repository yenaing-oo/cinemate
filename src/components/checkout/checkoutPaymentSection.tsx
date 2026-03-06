"use client";

import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import { PaymentDetailsForm } from "~/components/checkout/paymentDetailsForm";
import type { ConfirmablePaymentDetails } from "~/components/checkout/paymentDetails";

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
    return (
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

                <div className="space-y-2">
                    <p className="text-muted-foreground text-sm">
                        Enter payment details to complete your booking.
                    </p>
                    <PaymentDetailsForm
                        onValidPaymentChange={onPaymentDetailsChange}
                    />
                </div>

                <div className="space-y-3">
                    <Button
                        className="relative w-full overflow-hidden rounded-xl border border-[#78dfff]/30 bg-gradient-to-r from-[#54d4ff] via-[#3cb8ff] to-[#66a4ff] text-[#04111f] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_12px_24px_rgba(47,157,255,0.25)] before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:skew-x-[-25deg] before:bg-gradient-to-r before:from-transparent before:via-white/45 before:to-transparent hover:shadow-[0_0_0_1px_rgba(255,255,255,0.28)_inset,0_16px_30px_rgba(58,177,255,0.32)]"
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
