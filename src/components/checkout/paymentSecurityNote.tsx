"use client";

import { ShieldCheck } from "lucide-react";

export function PaymentSecurityNote() {
    return (
        <div className="glass-card space-y-4 rounded-2xl border border-white/10 p-4">
            <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-300" />
                <p className="text-sm font-medium">Secure payment details</p>
            </div>
        </div>
    );
}
