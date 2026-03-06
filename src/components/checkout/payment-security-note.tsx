"use client";

import { LockKeyhole, ShieldCheck } from "lucide-react";

export function PaymentSecurityNote() {
    return (
        <div className="glass-card space-y-4 rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-300" />
                <p className="text-sm font-medium">Secure payment details</p>
            </div>
            <div className="flex gap-3 rounded-xl border border-white/8 bg-white/5 p-3 text-sm">
                <LockKeyhole className="mt-0.5 size-4 shrink-0 text-sky-200" />
                <p className="text-muted-foreground">
                    Card details stay in local form state for confirmation
                    only. The current booking flow does not persist the full
                    card number or CVV in the booking session.
                </p>
            </div>
        </div>
    );
}
