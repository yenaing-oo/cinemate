"use client";

import { CreditCard } from "lucide-react";
import { cn } from "~/lib/utils";

interface PaymentCardPreviewProps {
    cardholderName: string;
    cardNumber: string;
    expiry: string;
    cardBrand: string;
}

function maskCardNumber(cardNumber: string) {
    const trimmed = cardNumber.trim();
    if (!trimmed) {
        return "•••• •••• •••• ••••";
    }
    const groups = trimmed.split(" ");
    if (groups.length === 1) {
        return trimmed;
    }
    return groups
        .map((group, index) =>
            index < groups.length - 1 ? "••••" : group.padStart(4, "•")
        )
        .join(" ");
}

export function PaymentCardPreview({
    cardholderName,
    cardNumber,
    expiry,
    cardBrand,
}: PaymentCardPreviewProps) {
    return (
        <div className="rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(85,213,255,0.15),rgba(6,16,35,0.95)_55%,rgba(255,180,99,0.16))] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-muted-foreground text-[11px] font-semibold tracking-[0.28em] uppercase">
                        Payment Method
                    </p>
                    <p className="mt-2 text-lg font-semibold">{cardBrand}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 p-2">
                    <CreditCard className="size-4 text-sky-200" />
                </span>
            </div>
            <p className="mt-8 font-mono text-lg tracking-[0.3em] text-white/95">
                {maskCardNumber(cardNumber)}
            </p>
            <div className="mt-6 flex items-end justify-between gap-4">
                <div>
                    <p className="text-muted-foreground text-[11px] tracking-[0.2em] uppercase">
                        Cardholder
                    </p>
                    <p className={cn("mt-1 text-sm font-medium", !cardholderName && "text-white/50")}>
                        {cardholderName.trim() || "Name on card"}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground text-[11px] tracking-[0.2em] uppercase">
                        Expires
                    </p>
                    <p className={cn("mt-1 text-sm font-medium", !expiry && "text-white/50")}>
                        {expiry || "MM/YY"}
                    </p>
                </div>
            </div>
        </div>
    );
}
